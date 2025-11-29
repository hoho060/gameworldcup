const express = require("express");
const passport = require("passport");
const SteamStrategy = require("passport-steam").Strategy;
const session = require("express-session");
const axios = require("axios");
require("dotenv").config(); // 환경 변수 로드

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 10000;

// Express 세션 설정
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-session-secret", // 세션 비밀키
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      secure: true,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    }, // HTTPS 환경에 맞게 설정
  })
);

// Passport 설정
passport.use(
  new SteamStrategy(
    {
      returnURL:
        process.env.RETURN_URL || "https://gameworldcup.onrender.com/auth/steam/return", // 리턴 URL
      realm: process.env.REALM_URL || "https://gameworldcup.onrender.com/", // 영역 URL
      apiKey: process.env.STEAM_API_KEY, // Steam API 키 (환경 변수로 설정)
    },
    (identifier, profile, done) => {
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

app.use(passport.initialize());
app.use(passport.session());

app.use((err, req, res, next) => {
  console.error(err.stack); // 오류 로그
  res.status(500).send("Something went wrong! Check the server logs.");
});

// 정적 파일 제공 (HTML, CSS, JS)
app.use(express.static("Public"));

// 기본 로그인 페이지
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/Public/index.html");
});

// Steam 인증 시작
app.get(
  "/auth/steam",
  passport.authenticate("steam", { failureRedirect: "/" })
);

// Steam 인증 후 리턴 처리
app.get(
  "/auth/steam/return",
  passport.authenticate("steam", { failureRedirect: "/" }),
  async (req, res) => {
    // 로그인 성공 후 Steam 사용자 정보와 게임 목록을 반환
    try {
      const user = req.user;
      const steamId = user.id;

      // Steam API에서 사용자 게임 목록 가져오기
      const response = await axios.get(
        `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/`,
        {
          params: {
            key: process.env.STEAM_API_KEY, // 환경 변수에서 API 키 사용
            steamid: steamId,
            include_appinfo: true,
            format: "json",
          },
        }
      );

      const games = response.data?.response?.games || [];

      console.log("로그인 성공:", user.displayName);
      res.redirect("/profile");
    } catch (error) {
      console.error("Error fetching games:", error.message);
      res.redirect("/profile");
    }
  }
);

app.get("/profile", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/"); // 로그인 페이지로 리디렉션
  }

  // 사용자 프로필 정보 출력
  res.send(`
    <h1>Welcome, ${req.user.displayName}</h1>
    <p>Steam ID: ${req.user.id}</p>
    <p>Profile: <a href="${req.user._json.profileurl}">${req.user._json.profileurl}</a></p>
    <img src="${req.user._json.avatarfull}" alt="Avatar">
    <button><a href="/">홈으로 돌아가기</a></button> <!-- 홈으로 돌아가는 버튼 추가 -->
  `);
});

app.get("/user", async (req, res) => {
  if (req.isAuthenticated()) {
    // Steam API에서 사용자 게임 목록 가져오기
    try {
      const steamId = req.user.id;
      const response = await axios.get(
        `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/`,
        {
          params: {
            key: process.env.STEAM_API_KEY, // 환경 변수에서 API 키 사용
            steamid: steamId,
            include_appinfo: true,
            format: "json",
          },
        }
      );

      // 플레이 시간이 0인 게임을 제외하고 필터링
      const games = response.data.response.games.filter(
        (game) => game.playtime_forever > 0
      );

      res.json({
        displayName: req.user.displayName,
        steamId: req.user.id,
        profileUrl: req.user._json.profileurl,
        avatar: req.user._json.avatarfull,
        games: games,
      });
    } catch (error) {
      console.error("Error fetching games:", error);
      res.status(500);
    }
  } else {
    res.status(401).json({ message: "User not authenticated" });
  }
});

// 로그아웃 처리
app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});








