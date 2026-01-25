from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import pandas as pd
import os

app = Flask(__name__)

# Enhanced CORS configuration
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "ngrok-skip-browser-warning", "Accept"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": False,
        "max_age": 3600
    }
})

# Add explicit OPTIONS handler
@app.route('/api/search', methods=['OPTIONS'])
def handle_options():
    response = jsonify({'status': 'ok'})
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,ngrok-skip-browser-warning,Accept')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    return response

def get_db():
    conn = sqlite3.connect('auction_data.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get overall statistics"""
    conn = get_db()
    cursor = conn.cursor()
    
    stats = {}
    cursor.execute("SELECT COUNT(*) FROM vehicles")
    stats['total_vehicles'] = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(DISTINCT brand) FROM vehicles")
    stats['unique_brands'] = cursor.fetchone()[0]
    
    cursor.execute("SELECT AVG(price) FROM vehicles WHERE price > 0")
    stats['avg_price'] = round(cursor.fetchone()[0], 2)
    
    cursor.execute("SELECT COUNT(*) FROM vehicles WHERE status = 'New'")
    stats['new_vehicles'] = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM vehicles WHERE status = 'Used'")
    stats['used_vehicles'] = cursor.fetchone()[0]
    
    conn.close()
    return jsonify(stats)

@app.route('/api/brands', methods=['GET'])
def get_brands():
    """Get all brands"""
    conn = get_db()
    df = pd.read_sql_query("SELECT DISTINCT brand FROM vehicles WHERE brand IS NOT NULL ORDER BY brand", conn)
    conn.close()
    return jsonify(df['brand'].tolist())

@app.route('/api/models/<brand>', methods=['GET'])
def get_models(brand):
    """Get models for a specific brand"""
    conn = get_db()
    df = pd.read_sql_query(
        "SELECT DISTINCT model FROM vehicles WHERE LOWER(brand) = LOWER(?) AND model IS NOT NULL ORDER BY model",
        conn,
        params=(brand,)
    )
    conn.close()
    return jsonify(df['model'].tolist())

@app.route('/api/search', methods=['GET'])
def search_vehicles():
    """Search vehicles with filters"""
    brand = request.args.get('brand')
    model = request.args.get('model')
    year = request.args.get('year')
    status = request.args.get('status')
    min_price = request.args.get('min_price')
    max_price = request.args.get('max_price')
    limit = request.args.get('limit', 100)
    
    query = "SELECT * FROM vehicles WHERE 1=1"
    params = []
    
    if brand:
        query += " AND LOWER(brand) = LOWER(?)"
        params.append(brand)
    
    if model:
        query += " AND LOWER(model) = LOWER(?)"
        params.append(model)
    
    if year:
        query += " AND year = ?"
        params.append(int(year))
    
    if status:
        query += " AND LOWER(status) = LOWER(?)"
        params.append(status)
    
    if min_price:
        query += " AND price >= ?"
        params.append(float(min_price))
    
    if max_price:
        query += " AND price <= ?"
        params.append(float(max_price))
    
    query += f" LIMIT {limit}"
    
    conn = get_db()
    df = pd.read_sql_query(query, conn, params=params)
    conn.close()
    
    # Convert to dict and replace NaN with None (null in JSON)
    vehicles = df.to_dict('records')
    for vehicle in vehicles:
        for key, value in vehicle.items():
            if pd.isna(value):
                vehicle[key] = None
    
    response = jsonify({
        'count': len(vehicles),
        'vehicles': vehicles
    })
    
    # Add CORS headers explicitly
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response
@app.route('/api/price-stats', methods=['GET'])
def get_price_stats():
    """Get price statistics for brand/model/year"""
    brand = request.args.get('brand')
    model = request.args.get('model')
    year = request.args.get('year')
    
    query = """
        SELECT 
            COUNT(*) as count,
            AVG(price) as avg_price,
            MIN(price) as min_price,
            MAX(price) as max_price,
            AVG(mileage) as avg_mileage
        FROM vehicles 
        WHERE 1=1
    """
    params = []
    
    if brand:
        query += " AND LOWER(brand) = LOWER(?)"
        params.append(brand)
    
    if model:
        query += " AND LOWER(model) = LOWER(?)"
        params.append(model)
    
    if year:
        query += " AND year = ?"
        params.append(int(year))
    
    conn = get_db()
    df = pd.read_sql_query(query, conn, params=params)
    conn.close()
    
    result = df.to_dict('records')[0]
    # Round numbers
    for key in result:
        if result[key] and key != 'count':
            result[key] = round(result[key], 2)
    
    return jsonify(result)

@app.route('/api/status-summary', methods=['GET'])
def get_status_summary():
    """Get summary by status"""
    conn = get_db()
    df = pd.read_sql_query("""
        SELECT 
            status,
            COUNT(*) as count,
            AVG(price) as avg_price
        FROM vehicles 
        WHERE status IS NOT NULL
        GROUP BY status
    """, conn)
    conn.close()
    return jsonify(df.to_dict('records'))

if __name__ == '__main__':
    print("="*60)
    print("API Server Starting...")
    print("="*60)
    print("API will be available at: http://localhost:5000")
    print("\nEndpoints:")
    print("  GET /api/stats - Overall statistics")
    print("  GET /api/brands - All brands")
    print("  GET /api/models/<brand> - Models for a brand")
    print("  GET /api/search?brand=X&model=Y - Search vehicles")
    print("  GET /api/price-stats?brand=X&model=Y&year=Z - Price stats")
    print("  GET /api/status-summary - Status summary")
    print("="*60)
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
