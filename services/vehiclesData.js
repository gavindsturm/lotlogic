// preprocessVehicles.js
import fs from "fs";
import csv from "csv-parser";

const vehiclesData = {};

fs.createReadStream("vehicles.csv") // your CSV
  .pipe(csv())
  .on("data", (row) => {
    const year = row.year;
    const make = row.make.toUpperCase();
    const model = row.model.toUpperCase();
    const VClass = row.VClass || "SEDAN"; // match your guide

    vehiclesData[`${year} ${make} ${model}`] = { VClass };
  })
  .on("end", () => {
    const content = `export const vehiclesData = ${JSON.stringify(vehiclesData, null, 2)};`;
    fs.writeFileSync("services/vehiclesData.js", content);
    console.log("vehiclesData.js generated successfully!");
  });
