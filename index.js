console.log("Let write js");
let currentSong = new Audio();
let songs;
let currFolder;
let sourceType = "songs";

function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00"; // Default until loaded
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

async function getsongs(folder, type = "songs") {
  currFolder = folder;
  sourceType = type;

  try {
    // Fetch directory listing using relative path
    let a = await fetch(`./${type}/${currFolder}/`);
    let response = await a.text();

    // Put response HTML into a temp div so we can query <a>
    let div = document.createElement("div");
    div.innerHTML = response;

    let as = div.getElementsByTagName("a");
    songs = [];

    // Clear old list
    let songUL = document.querySelector(".album ul");
    songUL.innerHTML = "";

    for (let index = 0; index < as.length; index++) {
      const element = as[index];

      // Only care about .mp3 files
      if (element.href.endsWith(".mp3")) {
        // Get raw href instead of absolute
        let rawHref = element.getAttribute("href");

        // Fix Windows backslashes (%5C) -> slashes
        rawHref = rawHref.replaceAll("%5C", "/");

        // Extract file name
        let fileName = rawHref.split("/").pop();

        // Human-friendly display name
        let displayName = decodeURIComponent(fileName);

        // Store raw fileName (used for playing)
        songs.push(fileName);

        // Add to list
        songUL.innerHTML += `
          <li>
            <div class="music">
              <img src="./Images/music.png" width="30px" height="30px">
            </div>
            <div class="info">
              <div class="album-text">${displayName}</div>
              <div class="album-author">Gagan</div>
            </div>
            <div class="playnow">
              <span style="font-size:smaller;">Play Now</span>
              <img src="./Images/play.png" alt="">
            </div>
          </li>`;
      }
    }

    // Attach click listeners to play each song
    Array.from(songUL.getElementsByTagName("li")).forEach((e) => {
      e.addEventListener("click", () => {
        playMusic(e.querySelector(".album-text").innerHTML.trim());
      });
    });
    
    return songs;
  } catch (error) {
    console.error(`Error loading songs from ${type}/${folder}:`, error);
    // Fallback: clear the song list
    let songUL = document.querySelector(".album ul");
    songUL.innerHTML = "<li>Error loading songs</li>";
    return [];
  }
}

const playMusic = (track, pause = false) => {
  // Use relative path for GitHub Pages
  currentSong.src = `./${sourceType}/${currFolder}/` + track;

  if (!pause) {
    currentSong.play().catch(error => {
      console.error("Error playing audio:", error);
      play.src = "./Images/play.png";
    });
    play.src = "./Images/pause.png";
  }

  document.querySelector(".songinfo").innerHTML = decodeURI(track);
  document.querySelector(".songtime").innerHTML = "00.00 / 00.00";
};

async function displayAlbums() {
  try {
    // Fetch directory listing using relative path
    let a = await fetch(`./songs/`);
    let response = await a.text();

    // Temp div to parse HTML
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");
    cardContainer.innerHTML = ""; // Clear existing content

    let array = Array.from(anchors);
    for (let index = 0; index < array.length; index++) {
      const e = array[index];

      // Get raw href instead of browser-expanded
      let rawHref = e.getAttribute("href");

      // Fix backslashes (%5C) -> slashes
      if (!rawHref) continue;
      rawHref = rawHref.replaceAll("%5C", "/");

      // Only handle valid folders inside /songs/
      if (rawHref.includes("/songs/") || rawHref.endsWith("/")) {
        // Extract folder name
        let parts = rawHref.split("/");
        let folder = parts[parts.length - 2] || parts[parts.length - 1]; // handle both cases

        // Skip parent directory links
        if (folder === ".." || folder === "." || folder === "") continue;

        try {
          // Get meta info using relative path
          let metaReq = await fetch(`./songs/${folder}/info.json`);
          let meta = await metaReq.json();

          // Render card
          cardContainer.innerHTML += `
            <div class="card" data-folder="${folder}">
              <div class="play">
                <img src="./Images/play-circle.svg" alt="" width="40px" height="40px">
              </div>
              <img src="./songs/${folder}/cover.jpeg" alt="" onerror="this.src='./Images/music.png'">
              <h2>${meta.title}</h2>
              <p>${meta.description}</p>
            </div>`;
        } catch (err) {
          console.warn(`No info.json for folder ${folder}`, err);
          // Still create a card with default info
          cardContainer.innerHTML += `
            <div class="card" data-folder="${folder}">
              <div class="play">
                <img src="./Images/play-circle.svg" alt="" width="40px" height="40px">
              </div>
              <img src="./songs/${folder}/cover.jpeg" alt="" onerror="this.src='./Images/music.png'">
              <h2>${folder}</h2>
              <p>Music Collection</p>
            </div>`;
        }
      }
    }

    // Attach click listeners
    Array.from(document.getElementsByClassName("card")).forEach((e) => {
      e.addEventListener("click", async (item) => {
        await getsongs(item.currentTarget.dataset.folder, "songs");
      });
    });
  } catch (error) {
    console.error("Error loading albums:", error);
  }
}

//------------NEW FEATURE ARTIST LOADING-------------

async function displayArtist() {
  try {
    // Fetch directory listing using relative path
    let a = await fetch(`./Artist/`);
    let response = await a.text();

    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let artistContainer = document.querySelector(".artistContainer");
    artistContainer.innerHTML = ""; // Clear existing content

    let array = Array.from(anchors);
    for (let index = 0; index < array.length; index++) {
      const e = array[index];

      // Get raw href instead of absolute
      let rawHref = e.getAttribute("href");
      if (!rawHref) continue;

      // Fix Windows backslashes (%5C → /)
      rawHref = rawHref.replaceAll("%5C", "/");

      if (rawHref.includes("/Artist/") || rawHref.endsWith("/")) {
        // Extract folder name
        let parts = rawHref.split("/");
        let folder = parts[parts.length - 2] || parts[parts.length - 1]; // handle both cases

        // Skip parent directory links
        if (folder === ".." || folder === "." || folder === "") continue;

        try {
          // Fetch metadata using relative path
          let b = await fetch(`./Artist/${folder}/info.json`);
          let meta = await b.json();

          // Render artist card
          artistContainer.innerHTML += `
            <div class="artist" data-folder="${folder}">
              <img src="./Artist/${folder}/cover.jpeg" alt="" class="artistpht" onerror="this.src='./Images/music.png'">
              <p class="artist-Text">${meta.ArtistName}</p>
            </div>`;
        } catch (err) {
          console.warn(`No info.json for artist ${folder}`, err);
          // Still create a card with default info
          artistContainer.innerHTML += `
            <div class="artist" data-folder="${folder}">
              <img src="./Artist/${folder}/cover.jpeg" alt="" class="artistpht" onerror="this.src='./Images/music.png'">
              <p class="artist-Text">${folder}</p>
            </div>`;
        }
      }
    }

    // Attach click listeners
    Array.from(document.getElementsByClassName("artist")).forEach((e) => {
      e.addEventListener("click", async (item) => {
        await getsongs(item.currentTarget.dataset.folder, "Artist");
      });
    });
  } catch (error) {
    console.error("Error loading artists:", error);
  }
}

//----------------NEW FEATURE ENDED--------------

async function main() {
  // Get songs from default album
  await getsongs("DADA");
  
  // Play first song if available
  if (songs && songs.length > 0) {
    playMusic(songs[0], true);
  }

  // DISPLAY ALL ALBUMS ON THE PAGE
  displayAlbums();

  // DISPLAY ALL ARTIST ON THE PAGE
  displayArtist();

  // ADD EVENT LISTENER TO PLAY , NEXT ,PREVIOUS
  const playButton = document.getElementById("play");
  const previousButton = document.getElementById("previous");
  const nextButton = document.getElementById("next");

  playButton.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play().catch(error => {
        console.error("Error playing audio:", error);
      });
      playButton.src = "./Images/pause.png";
    } else {
      currentSong.pause();
      playButton.src = "./Images/play.png";
    }
  });

  currentSong.addEventListener("loadeddata", () => {
    let duration = currentSong.duration;
    // console.log(currentSong.duration, currentSong.currentSrc, currentSong.currentTime);
  });

  // listen for time update event
  currentSong.addEventListener("timeupdate", () => {
    let progressPercent = (currentSong.currentTime / currentSong.duration) * 100;

    document.querySelector(".songtime").innerHTML = `${formatTime(
      currentSong.currentTime
    )} / ${formatTime(currentSong.duration)}`;
    document.querySelector(".circle").style.left =
      (currentSong.currentTime / currentSong.duration) * 100 + "%";

    document.querySelector(".progress").style.width = progressPercent + "%";
  });

  // ADD EVENT LISTENER TO SEEK BAR
  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = percent + "%";
    currentSong.currentTime = (currentSong.duration * percent) / 100;
    document.querySelector(".progress").style.width = percent + "%";
  });

  // ADD EVENT LISTENER TO PREVIOUS NEXT
  previousButton.addEventListener("click", () => {
    let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
    if (index - 1 >= 0) {
      playMusic(songs[index - 1]);
    }
  });

  nextButton.addEventListener("click", () => {
    let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
    if (index + 1 < songs.length) {
      playMusic(songs[index + 1]);
    }
  });

  // ADD VOLUME EVENT LISTENER
  document
    .querySelector(".range")
    .getElementsByTagName("input")[0]
    .addEventListener("change", (e) => {
      currentSong.volume = parseInt(e.target.value) / 100;
    });

  // ADD EVENT LISTENER TO MUTE
  document.querySelector(".volume>img").addEventListener("click", (e) => {
    let img = e.target;

    if (img.src.endsWith("volume-high.png")) {
      img.src = "./Images/volume-off.png";
      currentSong.volume = 0;
      document
        .querySelector(".range")
        .getElementsByTagName("input")[0].value = 0;
    } else {
      img.src = "./Images/volume-high.png";
      currentSong.volume = 0.1;
      document
        .querySelector(".range")
        .getElementsByTagName("input")[0].value = 20;
    }
  });

  // ----------HAMBURGER FUNCTION----------
  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
  });

  // CLOSE BUTTON
  document.querySelector(".cross").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-100%";
  });
}

main();