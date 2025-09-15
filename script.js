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

  // Fetch directory listing
  let a = await fetch(`http://127.0.0.1:3000/${type}/${currFolder}/`);
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
}

const playMusic = (track, pause = false) => {
  //   Play first song
  // var audio = new Audio("/songs/"+track);
  currentSong.src = `/${sourceType}/${currFolder}/` + track;

  if (!pause) {
    currentSong.play();
    play.src = "./Images/pause.png";
  }

  document.querySelector(".songinfo").innerHTML = decodeURI(track);

  document.querySelector(".songtime").innerHTML = "00.00 / 00.00";
};

async function displayAlbums() {
  let a = await fetch(`http://127.0.0.1:3000/songs/`);
  let response = await a.text();

  // Temp div to parse HTML
  let div = document.createElement("div");
  div.innerHTML = response;
  let anchors = div.getElementsByTagName("a");
  // console.log(anchors)
  let cardContainer = document.querySelector(".cardContainer");

  let array = Array.from(anchors);
  for (let index = 0; index < array.length; index++) {
    const e = array[index];

    // Get raw href instead of browser-expanded
    let rawHref = e.getAttribute("href");

    // Fix backslashes (%5C) -> slashes
    if (!rawHref) continue;
    rawHref = rawHref.replaceAll("%5C", "/");

    // Only handle valid folders inside /songs/
    if (rawHref.includes("/songs/")) {
      // Extract folder name
      let parts = rawHref.split("/");
      let folder = parts[parts.length - 2]; // second last part

      try {
        // Get meta info
        let metaReq = await fetch(`http://127.0.0.1:3000/songs/${folder}/info.json`);
        let meta = await metaReq.json();

        // Render card
        cardContainer.innerHTML += `
          <div class="card" data-folder="${folder}">
            <div class="play">
              <img src="./Images/play-circle.svg" alt="" width="40px" height="40px">
            </div>
            <img src="/songs/${folder}/cover.jpeg" alt="">
            <h2>${meta.title}</h2>
            <p>${meta.description}</p>
          </div>`;
      } catch (err) {
        console.warn(`No info.json for folder ${folder}`, err);
      }
    }
  }

  // Attach click listeners
  Array.from(document.getElementsByClassName("card")).forEach((e) => {
    e.addEventListener("click", async (item) => {
      songs = await getsongs(item.currentTarget.dataset.folder, "songs");
    });
  });
}



//------------NEW FEATURE ARTIST LOADING-------------


async function displayArtist() {
  let a = await fetch(`http://127.0.0.1:3000/Artist/`);
  let response = await a.text();

  let div = document.createElement("div");
  div.innerHTML = response;
  let anchors = div.getElementsByTagName("a");
  let artistContainer = document.querySelector(".artistContainer");

  let array = Array.from(anchors);
  for (let index = 0; index < array.length; index++) {
    const e = array[index];

    // Get raw href instead of absolute
    let rawHref = e.getAttribute("href");
    if (!rawHref) continue;

    // Fix Windows backslashes (%5C → /)
    rawHref = rawHref.replaceAll("%5C", "/");

    if (rawHref.includes("/Artist/")) {
      // Extract folder name
      let parts = rawHref.split("/");
      let folder = parts[parts.length - 2]; // second last part

      try {
        // Fetch metadata
        let b = await fetch(`http://127.0.0.1:3000/Artist/${folder}/info.json`);
        let meta = await b.json();

        // Render artist card
        artistContainer.innerHTML += `
          <div class="artist" data-folder="${folder}">
            <img src="/Artist/${folder}/cover.jpeg" alt="" class="artistpht">
            <p class="artist-Text">${meta.ArtistName}</p>
          </div>`;
      } catch (err) {
        console.warn(`No info.json for artist ${folder}`, err);
      }
    }
  }

  // Attach click listeners
  Array.from(document.getElementsByClassName("artist")).forEach((e) => {
    e.addEventListener("click", async (item) => {
      songs = await getsongs(item.currentTarget.dataset.folder, "Artist");
    });
  });
}

//----------------NEW FEATURE ENDED--------------
async function main() {
  //get songs
  await getsongs("DADA");
  //console.log(songs);
  playMusic(songs[0], true);

  //DISPLAY ALL ALBUMS ON THE PAGE
  displayAlbums();

  //DISPLAY ALL ARTIST ON THE PAGE
  displayArtist();

  //ADD EVENT LISTENER TO PLAY , NEXT ,PREVIOUS

  play.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      play.src = "./Images/pause.png";
    } else {
      currentSong.pause();
      play.src = "./Images/play.png";
    }
  });

  currentSong.addEventListener("loadeddata", () => {
    let duration = currentSong.duration;
    // console.log(currentSong.duration, currentSong.currentSrc, currentSong.currentTime);
  });

  //listen for time update event

  currentSong.addEventListener("timeupdate", () => {
    //console.log(currentSong.currentTime,currentSong.duration);
    let progressPercent = (currentSong.currentTime / currentSong.duration) * 100;

    document.querySelector(".songtime").innerHTML = `${formatTime(
      currentSong.currentTime
    )} / ${formatTime(currentSong.duration)}`;
    document.querySelector(".circle").style.left =
      (currentSong.currentTime / currentSong.duration) * 100 + "%";

      document.querySelector(".progress").style.width = progressPercent + "%";
  });

  //ADD EVENT LISTENER TO SEEK BAR
  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = percent + "%";
    currentSong.currentTime = (currentSong.duration * percent) / 100;

      document.querySelector(".progress").style.width = percent + "%";
  });
  //ADD EVENT LISTNER TO PREVIOUS NEXT

  previous.addEventListener("click", () => {
    //console.log('Previous Clicked');
    //console.log(currentSong);

    let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
    if (index - 1 >= 0) {
      playMusic(songs[index - 1]);
    }
  });

  next.addEventListener("click", () => {
    // console.log('Next Clicked');
    //console.log(currentSong);
    // console.log(currentSong.src.split("/").slice(4));

    let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);

    //console.log(songs,index);
    if (index + 1 < songs.length) {
      playMusic(songs[index + 1]);
    }
  });

  //ADD VOLUME EVENT LISTNER

  document
    .querySelector(".range")
    .getElementsByTagName("input")[0]
    .addEventListener("change", (e) => {
      //console.log(e.target.value);

      currentSong.volume = parseInt(e.target.value) / 100;
    });

  //ADD EVENT LISTNER TO MUTE

document.querySelector(".volume>img").addEventListener("click", (e) => {
  let img = e.target;

  if (img.src.endsWith("volume-high.png")) {
    img.src = "./Images/volume-off.png";
    currentSong.volume = 0;

      document
    .querySelector(".range")
    .getElementsByTagName("input")[0].value =0;
  } else {
    img.src = "./Images/volume-high.png";
    currentSong.volume = 0.1;

      document
    .querySelector(".range")
    .getElementsByTagName("input")[0].value = 20;
  }
});

//----------HAMBURGER FUNCTION----------

document.querySelector(".hamburger").addEventListener("click",()=>{
document.querySelector(".left").style.left = "0";
})


// CLOSE BUTTON
document.querySelector(".cross").addEventListener("click",()=>{
document.querySelector(".left").style.left = "-100%";
})

}
main();





