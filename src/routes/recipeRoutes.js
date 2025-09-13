import express from "express";

const router = express.Router();


router.get("/", (req, res) => {
  res.send("Hello World!");
});

router.post("/", (req, res) => {
  res.status(201).json({ message: "Data received" });
});

router.put("/:id", (req, res) => {
  res.status(200).json({ message: "Data updated" });
});

router.delete("/:id", (req, res) => {
  res.status(200).json({ message: "Data deleted" });
});

export default router;
