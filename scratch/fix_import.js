
const fs = require("fs");
let code = fs.readFileSync("src/app/doctor/revenue/page.tsx", "utf8");

const importStr = "import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from \"recharts\";";
const useClient = "\"use client\";";

if (code.includes(importStr) && code.includes(useClient)) {
    // Remove the import from wherever it is
    code = code.replace(importStr + "\n", "");
    code = code.replace(importStr + "\r\n", "");
    code = code.replace(importStr, "");
    
    // Put it after use client
    code = code.replace(useClient, useClient + "\n" + importStr);
    
    fs.writeFileSync("src/app/doctor/revenue/page.tsx", code);
    console.log("Fixed successfully");
}

