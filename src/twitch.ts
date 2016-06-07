/*
 *
 * Global constants
 *
 */


// Used to build the URI for the Wikipedia API call
// Full URL used for the API is
//
// apiPrefix + <query-string> + apiSuffix + <callback-function-name>
//
// const apiPrefix: string = "http://en.wikipedia.org/w/api.php?action=opensearch&namespace=0&format=json&search=";
// const apiSuffix: string = "&callback="; // Name of the callback is added by fetchJSONP


// const offlineMessage: string = "Offline";
const defaultErrorMessage: string = "Unidentified error"; // If API returns an error without a message
const infoBoxIDPrefix: string = "info-";

// Test data
const offlineDummy: APIReturn = {
  stream: null,
  _links: {
    self: "https://api.twitch.tv/kraken/streams/freecodecamp",
    channel: "https://api.twitch.tv/kraken/channels/freecodecamp"
  },
  requested: "freecodecamp"
};

const notFoundDummy: APIReturn = {
  error: "Not Found",
  message: "Channel 'suqkjfhkqjfh' does not exist",
  status: 404,
  requested: "suqkjfhkqjfh"
};

const onlineDummy: APIReturn = {
  stream: {
    _id: 21639364272,
    game: "Hearthstone: Heroes of Warcraft",
    viewers: 1333,
    created_at: "2016-06-02T06:58:53Z",
    video_height: 864,
    average_fps: 30,
    delay: 0,
    is_playlist: false,
    _links: {
      self: "https://api.twitch.tv/kraken/streams/superjj102"
    },
    preview: {
      small: "https://static-cdn.jtvnw.net/previews-ttv/live_user_superjj102-80x45.jpg",
      medium: "https://static-cdn.jtvnw.net/previews-ttv/live_user_superjj102-320x180.jpg",
      large: "https://static-cdn.jtvnw.net/previews-ttv/live_user_superjj102-640x360.jpg",
      template: "https://static-cdn.jtvnw.net/previews-ttv/live_user_superjj102-{width}x{height}.jpg"
    },
    channel: {
      mature: false,
      status: "[coL] Superjj - The miracle master",
      broadcaster_language: "en",
      display_name: "superjj102",
      game: "Hearthstone: Heroes of Warcraft",
      language: "de",
      _id: 58352686,
      name: "superjj102",
      created_at: "2014-03-07T14:05:12Z",
      updated_at: "2016-06-02T08:03:05Z",
      delay: null,
      logo: "https://static-cdn.jtvnw.net/jtv_user_pictures/superjj102-profile_image-a465d147fb62219c-300x300.jpeg",
      banner: null,
      video_banner: "https://static-cdn.jtvnw.net/jtv_user_pictures/superjj102-channel_offline_image-09c1e908eeb32c8e-1920x1080.jpeg",
      background: null,
      profile_banner: "https://static-cdn.jtvnw.net/jtv_user_pictures/superjj102-profile_banner-f21e237e2a304174-480.jpeg",
      profile_banner_background_color: "#080308",
      partner: true,
      url: "https://www.twitch.tv/superjj102",
      views: 1635891,
      followers: 33864,
      _links: {
        self: "http://api.twitch.tv/kraken/channels/superjj102",
        follows: "http://api.twitch.tv/kraken/channels/superjj102/follows",
        commercial: "http://api.twitch.tv/kraken/channels/superjj102/commercial",
        stream_key: "http://api.twitch.tv/kraken/channels/superjj102/stream_key",
        chat: "http://api.twitch.tv/kraken/chat/superjj102",
        features: "http://api.twitch.tv/kraken/channels/superjj102/features",
        subscriptions: "http://api.twitch.tv/kraken/channels/superjj102/subscriptions",
        editors: "http://api.twitch.tv/kraken/channels/superjj102/editors",
        teams: "http://api.twitch.tv/kraken/channels/superjj102/teams",
        videos: "http://api.twitch.tv/kraken/channels/superjj102/videos"
      }
    }
  },
  _links: {
    self: "https://api.twitch.tv/kraken/streams/superjj102",
    channel: "https://api.twitch.tv/kraken/channels/superjj102"
  },
  requested: "superjj102"
};




/*
 *
 * Start-up code to set up our event listeners
 *
 */


run_when_document_ready(function (): void {

  // Button to start a search
  // document.getElementById("search-button").addEventListener("click", startSearch);

  // Handle input into the search field
  // document.querySelector(".search-form").addEventListener("submit", function (event: Event): void {
  //   let input: HTMLInputElement = document.getElementById("search-input") as HTMLInputElement;
  //   launchSearch(input.value);
  //   event.preventDefault();
  // });

  // Test code
  updateDOM([
    offlineDummy, notFoundDummy, onlineDummy,
    offlineDummy, notFoundDummy, onlineDummy
  ]);

});


/*
 *
 * Types
 *
 */


// Type of the raw JSON result from the API call
type RawSearchResult = (string | string[])[];

// Type for the parsed API return for an offline stream
interface APIReturn {
  error?: string;
  message?: string;
  status?: number;
  _links?: any; // We don't use these
  stream?: null | Stream;
  requested: string; // We add this to hold the value we requested
}

interface Stream {
  game: string; // Name of the game being played
  viewers: number;
  average_fps: number;
  delay: number;
  video_height: number;
  is_playlist: boolean;
  created_at: string; // ISO date format, e.g., "2015-02-12T04:42:31Z",
  _id: number;
  channel: Channel;
  _links: any;
  preview: any;
}

interface Channel {
  mature: boolean;
  status: string;
  broadcaster_language: string; // e.g. "en"
  display_name: string;
  game: string;
  delay: any; // ?
  language: string; // e.g., "en",
  _id: number;
  name: string;
  created_at: string; // ISO Date format
  updated_at: string; // ISO Date format
  logo: string; // URL for image
  banner: null | string; // URL for image
  video_banner: string; // URL for image
  background: any; // ?
  profile_banner: string; // URL for image
  profile_banner_background_color: any; // ?
  partner: boolean;
  url: string;
  views: number;
  followers: number;
  _links: any; // We don't use these
}

/*
 *
 * Main working functions
 *
 */


// Starting a search means making the input field visible and putting cursor in it
// function startSearch(): void {

//   let input: HTMLFormElement = document.querySelector("#search-input") as HTMLFormElement;
//   input.style.visibility = "visible";
//   input.focus();

// }

// Launching a search uses a JSONP callback
// function launchSearch(query: string): void {

//   // jsonp<RawSearchResult>(apiPrefix + query + apiSuffix)
//   //   .then(validateResult)
//   //   .then(updateDOM)
//   //   .catch((e: Error) => console.log(e));

// }

// Update the search-results div in the DOM with the new search results
function updateDOM(results: APIReturn[]): void {

  const list: Element = document.querySelector(".list");

  // Remove any old search results
  while (list.firstChild) {
    list.removeChild(list.firstChild);
  }

  // Add each of the search results
  results.forEach((res: APIReturn): void => {

    if (res.error) {
      list.appendChild(createChannel(res.requested, res.message || defaultErrorMessage));
    } else if (!res.stream) {
      list.appendChild(createChannel(res.requested, ""));
    } else {
      list.appendChild(createChannel(res.requested, res.stream));
    }

  });

}

// // Create a DOM node for a channel without a stream
// function createOfflineChannel(name: string, message: string | undefined): Node {
//   let newBox: Element = document.createElement("div");
//   newBox.className = "channel offline";
//   newBox.appendChild(document.createTextNode(message || ""));
//   return newBox;
// }

// Create a DOM node representing a channel, takes the name of the channel and either its
// Stream or an error message (an empty string if offline)
function createChannel(channelName: string, stream: Stream | string): Node {

  // Top-level box
  let box: Element = document.createElement("div");
  box.className = "channel " + (typeof stream === "string" ? (stream === "" ? "offline" : "error") : "online");
  if (typeof stream !== "string") {
    box.addEventListener("click", () => {
      console.log("Click on", channelName);
      let e: HTMLElement = document.getElementById(infoBoxIDPrefix + channelName);
      e.style.display = e.style.display === "none" ? "flex" : "none";
    });
  }

  // Top part of box is always visible - logo on the left (if online), name on right
  let topBox: HTMLDivElement = document.createElement("div");
  topBox.className = "channel-top";
  box.appendChild(topBox);
  let leftBox: HTMLDivElement = document.createElement("div");
  leftBox.className = "channel-top-left";
  if (typeof stream !== "string" && stream.channel && stream.channel.logo) {
      let logo: HTMLImageElement = document.createElement("img");
      logo.className = "channel-logo";
      logo.src = stream.channel.logo;
      leftBox.appendChild(logo);
  }
  topBox.appendChild(leftBox);
  let rightBox: HTMLDivElement = document.createElement("div");
  rightBox.className = "channel-top-right";
  if (typeof stream === "string") {
    let text: string = stream === "" ? channelName : (stream + " (" + channelName + ")");
    rightBox.appendChild(document.createTextNode(text));
  } else {
    let anchor: HTMLAnchorElement = document.createElement("a");
    anchor.appendChild(document.createTextNode(channelName));
    anchor.href = stream._links.self;
    rightBox.appendChild(anchor);
  }
  topBox.appendChild(rightBox);

  // Bottom part has its display changed on click
  let infoBox: HTMLDivElement = document.createElement("div");
  infoBox.className = "channel-info";
  infoBox.id = infoBoxIDPrefix + channelName;
  infoBox.style.display = "none";
  if (typeof stream !== "string") {
    addInfoItem(infoBox, "Game", stream.channel.game);
    addInfoItem(infoBox, "Status", stream.channel.status);
    addInfoItem(infoBox, "Views", stream.channel.views.toString());
    addInfoItem(infoBox, "Delay", stream.channel.delay || "-");
    addInfoItem(infoBox, "Video", stream.video_height + "px, " + stream.average_fps + "fps");
  }
  box.appendChild(infoBox);

  return box;

}

function addInfoItem(parent: HTMLElement, tag: string, content: string): void {
  let item: HTMLDivElement = document.createElement("div");
  item.className = "channel-info-item";
  let heading: HTMLHeadingElement = document.createElement("h4");
  heading.appendChild(document.createTextNode(tag));
  item.appendChild(heading);
  let para: HTMLParagraphElement = document.createElement("p");
  para.appendChild(document.createTextNode(content));
  item.appendChild(para);
  parent.appendChild(item);
}

/**
 *
 * Helper function
 *
 */


// Validate that the raw result of the JSON parsing has the expected format, then convert to our
// tidier search result type
// function validateResult(raw: RawSearchResult): APIReturn {

//   return offlineDummy;
// /*

//   if (Array.isArray(raw) &&

//       raw.length === 4 &&
//       typeof raw[0] === "string" &&
//       Array.isArray(raw[1]) &&
//       raw[1].every((x: string) => typeof x === "string")   &&
//       Array.isArray(raw[2]) &&
//       raw[2].every((x: string) => typeof x === "string")   &&
//       Array.isArray(raw[3]) &&
//       raw[3].every((x: string) => typeof x === "string")   &&
//       raw[1].length === raw[2].length &&
//       raw[2].length === raw[3].length) {

//     return {
//       query: raw[0],
//       titles: raw[1],
//       firstParas: raw[2],
//       urls: raw[3]
//      };

//    } else {

//      throw Error("Invalid search result");

//   }
//   */

// }


/*
 *
 * Library functions
 *
 */


// Standard function to run a function when document is loaded
function run_when_document_ready(fn: () => void): void {
  if (document.readyState !== "loading") {
    fn();
  } else {
    document.addEventListener("DOMContentLoaded", fn);
  }
}

// Simple function to make a jsonp request and wrap in a Promise
// Url paramater will have the name of the callback appended
// Adapted from https://github.com/camsong/fetch-jsonp
// function jsonp<T>(url: string): Promise<T> {

//   return new Promise((resolve: (r: T) => void) => {

//     // Create a random name for the callback function (so we can create many of them indpendently)
//     let callbackName: string = `callback_jsonp_${Date.now()}_${Math.ceil(Math.random() * 100000)}`;

//     // Add our callback function to the global window object which handles the JSON response from the URL
//     (window as any)[callbackName] = function (response: T): void {

//       // Pass the received JSON to the Promsie
//       resolve(response);

//       // Remove the script tag and the name in the the global window object
//       const script: HTMLElement = document.getElementById(callbackName);
//       document.getElementsByTagName("head")[0].removeChild(script);
//       delete (window as any)[callbackName];
//     };

//     // Add a script object to our document which will call our callback
//     const script: HTMLElement = document.createElement("script");
//     script.setAttribute("src", url + callbackName);
//     script.id = callbackName;
//     document.getElementsByTagName("head")[0].appendChild(script);

//   });
// }
