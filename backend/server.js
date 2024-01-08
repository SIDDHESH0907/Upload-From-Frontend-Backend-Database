const express = require("express");
const mysql2 = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const AdmZip = require("adm-zip");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const db = mysql2.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "authentication",
});

const executeQuery = (connection, sql, values) => {
  return new Promise((resolve, reject) => {
    connection.query(sql, values, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};


// ... (unchanged code)

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const zipBuffer = req.file.buffer;

    const zip = new AdmZip(zipBuffer);
    const zipEntries = zip.getEntries();
    let uploadedCount = 0;

    for (const entry of zipEntries) {
      if (entry.entryName.endsWith(".pdf")) {
        const pdfBuffer = entry.getData();
        const documentName = path.basename(entry.entryName, ".pdf");

        const fileNameParts = documentName.split("_");
        if (fileNameParts.length === 2) {
          const panNo = fileNameParts[0] || null;

          const match = fileNameParts[1].match(/(\d{2})-(\d{4}-\d{2})/);
          const quarter = match ? match[1] : null;
          const year = match ? match[2] : null;

          console.log(
            `Document Name: ${documentName}, PAN No: ${panNo}, Quarter: ${quarter}, Year: ${year}`
          );

          const query =
            "INSERT INTO pdf_upload (document_name, pan_no, quarter, year, pdf_data) VALUES (?, ?, ?, ?, ?)";
          await executeQuery(db, query, [
            documentName,
            panNo,
            quarter,
            year,
            pdfBuffer,
          ]);

          console.log(`PDF "${documentName}" uploaded to MySQL successfully`);
          uploadedCount++;
        } else {
          console.error(`Invalid document name format: ${documentName}`);
        }
      }
    }

    res.json({ success: true, uploadedCount });
  } catch (error) {
    console.error("Error uploading ZIP file:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ... (unchanged code)



app.listen(8081, () => {
  console.log("listening");
});
