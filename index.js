import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import fs from "fs/promises";
import path from "path";
import markdownIt from "markdown-it";
import fm from "front-matter";
import cookieParser from "cookie-parser";
import morgan from "morgan";

// settings
dotenv.config();
const app = express();
const port = process.env.PORT || 4000;
const url = process.env.URL || `http://localhost:`;
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const __pagedir = path.join(__dirname, "pages");
const files = await fs.readdir(__pagedir);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));

// view engine
app.set("views", __pagedir);
app.set("view engine", "pug");

// directories
for (let file of files) {
  const filePath = path.join(__pagedir, file);
  const extname = path.extname(file);

  if (extname === ".md" || extname === ".pug" || extname === ".html") {
    let fileName = path.basename(file, extname);
    app.get(`/${fileName}`, async (req, res) => {
      try {
        if (extname === ".pug") res.render(fileName);
        if (extname === ".html") res.sendFile(filePath);
        if (extname === ".md") {
          const mdFile = await fs.readFile(filePath, "utf-8");
          const { attributes, body } = fm(mdFile);
          const md = markdownIt();
          const mdParsed = md.render(body);

          res.render("layout-md", {
            ...attributes,
            content: mdParsed,
          });
        }
      } catch (error) {
        res.status(404).render("error-404");
      }
    });
  }
}

// routes
app.get("/", (req, res) => {
  res.render("index", { title: "SSG with Markdown and PUG" });
});
app.use((req, res, next) => {
  res.status(404).render("error-404", { title: "Page Not Found" });
});

// server
app.listen(port, () => {
  console.log(`Server is running on port ${url}${port}`);
});
