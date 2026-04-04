import mongoose from 'mongoose';
import Tour from "../model/Tours.js";
import User from "../model/Users.js";
import Review from "../model/Review.js";
import fs from "fs";


// Geliştirme aşamasında mongodbdeki verilerin sıkça değişceğinden veya bozulacğaından veritabanındaki verileri temizlmeye
// ve json dosyasındaki verileri veritabanına aktarmaya yarayan ve terminalden komutlarla çalışacak 2 fonksiyon yazalım

// .env dosyasında değşikenlere erişim sağlar
require("dotenv").config();

//  mongodb veritabanına bağlan (local) (atlas)
mongoose
  .connect(process.env.MONGO_LOCAL_URI)
  .then(() => {
    console.log("🎾 Veritabanına bağlandı");
  })
  .catch((err) => {
    console.log("💥 Veritbanına bağlanamadı!!");
  });

// json dosyasında verileri al
const tours = JSON.parse(fs.readFileSync(`./data/tours.json`, "utf-8"));
const users = JSON.parse(fs.readFileSync(`./data/users.json`, "utf-8"));
const reviews = JSON.parse(fs.readFileSync(`./data/reviews.json`, "utf-8"));

// devdata klasöründeki json dosylarını veritbanına aktarır
const importData = async () => {
  try {
    await Tour.create(tours, { validateBeforeSave: false });
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews, { validateBeforeSave: false });
    console.log("veriler veritabanına aktarıldı");
  } catch (err) {
    console.log(err);
  }

  process.exit();
};

// mongodbdeki verileri
const clearData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log("bütün veriler temizlendi");
  } catch (err) {
    console.log(err);
  }

  process.exit();
};

// node ./data/commands --import
// node ./data/commands --clear
// çalıştırılan komutun sonuna eklenen bayrağa göre doğru fonksiyonu tetikle
if (process.argv.includes("--import")) {
  importData().then(r => {
    console.log("Import hatasi")
  });
} else if (process.argv.includes("--clear")) {
  clearData().then(r => {
    console.log("Clear hatasi");
  });
}
