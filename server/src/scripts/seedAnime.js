import { sequelize } from "../config/database.js";
import Anime from "../models/Anime.js";

const animeData = [
  {
    title: "Death Note",
    originalTitle: "デスノート",
    description:
      "A high school student discovers a supernatural notebook that allows him to kill anyone by writing the victim's name while picturing their face.",
    imageUrl: "https://cdn.myanimelist.net/images/anime/9/9453.jpg",
    genre: ["Psychological", "Supernatural", "Thriller", "Mystery"],
    releaseYear: 2006,
    episodes: 37,
    duration: 23,
    status: "COMPLETED",
    rating: 8.62,
    ratingCount: 3000000,
  },
  {
    title: "Attack on Titan",
    originalTitle: "進撃の巨人",
    description:
      "In a world where humanity lives inside cities surrounded by enormous walls due to the Titans, giant humanoid creatures who devour humans seemingly without reason.",
    imageUrl: "https://cdn.myanimelist.net/images/anime/10/47347.jpg",
    genre: ["Action", "Drama", "Fantasy", "Mystery"],
    releaseYear: 2013,
    episodes: 87,
    duration: 24,
    status: "COMPLETED",
    rating: 8.54,
    ratingCount: 2800000,
  },
  {
    title: "Fullmetal Alchemist: Brotherhood",
    originalTitle: "鋼の錬金術師: Brotherhood",
    description:
      "Two brothers search for a Philosopher's Stone after an attempt to revive their deceased mother goes wrong and leaves them in damaged physical forms.",
    imageUrl: "https://cdn.myanimelist.net/images/anime/1223/96541.jpg",
    genre: ["Action", "Adventure", "Drama", "Fantasy"],
    releaseYear: 2009,
    episodes: 64,
    duration: 24,
    status: "COMPLETED",
    rating: 9.11,
    ratingCount: 2500000,
  },
  {
    title: "One Punch Man",
    originalTitle: "ワンパンマン",
    description:
      "The story of Saitama, a hero who can defeat any opponent with a single punch but seeks to find a worthy opponent after growing bored by a lack of challenge.",
    imageUrl: "https://cdn.myanimelist.net/images/anime/12/76049.jpg",
    genre: ["Action", "Comedy", "Sci-Fi", "Supernatural"],
    releaseYear: 2015,
    episodes: 12,
    duration: 24,
    status: "COMPLETED",
    rating: 8.5,
    ratingCount: 2000000,
  },
  {
    title: "Demon Slayer",
    originalTitle: "鬼滅の刃",
    description:
      "A young man becomes a demon slayer after his family is slaughtered and his sister is turned into a demon.",
    imageUrl: "https://cdn.myanimelist.net/images/anime/1286/99889.jpg",
    genre: ["Action", "Fantasy", "Historical", "Supernatural"],
    releaseYear: 2019,
    episodes: 26,
    duration: 23,
    status: "COMPLETED",
    rating: 8.92,
    ratingCount: 2200000,
  },
  {
    title: "My Hero Academia",
    originalTitle: "僕のヒーローアカデミア",
    description:
      "In a world where people with superpowers known as 'Quirks' are the norm, Izuku Midoriya, a boy born without any powers, dreams of becoming a superhero himself.",
    imageUrl: "https://cdn.myanimelist.net/images/anime/10/78745.jpg",
    genre: ["Action", "Comedy", "Super Power", "School"],
    releaseYear: 2016,
    episodes: 113,
    duration: 23,
    status: "ONGOING",
    rating: 8.39,
    ratingCount: 1900000,
  },
  {
    title: "Steins;Gate",
    originalTitle: "シュタインズ・ゲート",
    description:
      "A self-proclaimed mad scientist discovers a way to send messages to the past, leading to dire consequences and a race against time to save his friends.",
    imageUrl: "https://cdn.myanimelist.net/images/anime/5/73199.jpg",
    genre: ["Thriller", "Sci-Fi", "Drama", "Psychological"],
    releaseYear: 2011,
    episodes: 24,
    duration: 24,
    status: "COMPLETED",
    rating: 9.08,
    ratingCount: 1800000,
  },
  {
    title: "Jujutsu Kaisen",
    originalTitle: "呪術廻戦",
    description:
      "A high school student joins a secret organization of Jujutsu Sorcerers to fight against powerful Curses, after his friend is possessed by a powerful Curse.",
    imageUrl: "https://cdn.myanimelist.net/images/anime/1171/109222.jpg",
    genre: ["Action", "Supernatural", "School", "Fantasy"],
    releaseYear: 2020,
    episodes: 24,
    duration: 23,
    status: "ONGOING",
    rating: 8.78,
    ratingCount: 1700000,
  },
  {
    title: "Spy x Family",
    originalTitle: "スパイファミリー",
    description:
      "A spy must create a fake family to complete his mission, unknowingly adopting a telepath daughter and marrying an assassin.",
    imageUrl: "https://cdn.myanimelist.net/images/anime/1441/122795.jpg",
    genre: ["Action", "Comedy", "Slice of Life", "Supernatural"],
    releaseYear: 2022,
    episodes: 25,
    duration: 23,
    status: "ONGOING",
    rating: 8.61,
    ratingCount: 1500000,
  },
  {
    title: "Tokyo Ghoul",
    originalTitle: "東京喰種",
    description:
      "A college student is turned into a half-ghoul after being involved in an accident, forcing him to adapt to their lifestyle of eating human flesh to survive.",
    imageUrl: "https://cdn.myanimelist.net/images/anime/5/64449.jpg",
    genre: ["Action", "Horror", "Supernatural", "Psychological"],
    releaseYear: 2014,
    episodes: 12,
    duration: 24,
    status: "COMPLETED",
    rating: 7.79,
    ratingCount: 2100000,
  },
];

const seedAnime = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to database successfully.");

    // Count existing anime
    const existingCount = await Anime.count();
    console.log(`Found ${existingCount} existing anime in database.`);

    // Create all anime
    const createdAnime = await Anime.bulkCreate(animeData);
    console.log(
      `Successfully added ${createdAnime.length} new anime to database.`
    );

    // Verify the data
    const totalCount = await Anime.count();
    console.log(`Total anime in database: ${totalCount}`);

    process.exit(0);
  } catch (error) {
    console.error("Error seeding anime data:", error);
    process.exit(1);
  }
};

seedAnime();
