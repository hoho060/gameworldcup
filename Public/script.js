// script.js: 페이지가 로드되면 Steam 로그인 상태를 확인하고 게임 목록을 받아옴
$(document).ready(function () {
  // 로그인 후 사용자 정보를 서버로부터 받아옵니다.
  $.get("/user", function (user) {
    if (user) {
      // 로그인 성공 시 사용자 정보 표시
      $("#user-info").show();
      $("#steam-username").text(user.displayName); // Steam 이름 표시
      $("#steam-profile-link").attr("href", user.profileUrl); // 프로필 링크 설정

      // Steam ID를 통해 게임 목록을 가져옵니다.
      $.get("/games", function (games) {
        if (games.length > 0) {
          $("#game-list").show();
          games.forEach(function (game) {
            $("#games").append("<li>" + game.name + "</li>");
          });
        }
      }).fail(function () {});
    }
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const loginBtn = document.getElementById("loginBtn");
  const userInfoSection = document.getElementById("user-info");
  const gameListSection = document.getElementById("game-list");
  const steamUsernameElement = document.getElementById("steam-username");
  const steamProfileLink = document.getElementById("steam-profile-link");
  const gamesList = document.getElementById("games");

  // 로그인 후 게임 목록 가져오기
  fetch("/user")
    .then((response) => {
      if (!response.ok) {
        throw new Error("로그인 실패");
      }
      return response.json();
    })
    .then((data) => {
      // 로그인 성공 후 정보 업데이트
      userInfoSection.style.display = "block";
      steamUsernameElement.textContent = `환영합니다, ${data.displayName}`;
      steamProfileLink.href = data.profileUrl;
      steamProfileLink.textContent = "프로필 보기";

      // 게임 목록 업데이트
      gameListSection.style.display = "block";
      if (data.games && data.games.length > 0) {
        data.games.forEach((game) => {
          const li = document.createElement("li");
          li.textContent = game.name;
          gamesList.appendChild(li);
        });
      } else {
      }
    })
    .catch((error) => {
      console.error(error);
      gameListSection.style.display = "none";
    });
});
