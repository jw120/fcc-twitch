/*
 *
 * Global constants
 *
 */

const offlineTestMode: boolean = false;


const apiPrefix: string = "https://api.twitch.tv/kraken/streams/";
const apiSuffix: string = "?callback="; // Name of the callback is added by fetchJSONP

const localStorageKey: string = "channelNames";

// Channels used on first startup - based on freecodecamp suggestions
const defaultChannels: string[] = [
  "ESL_SC2", "OgamingSC2", "cretetion", "freecodecamp",
  "storbeck", "habathcx", "RobotCaleb", "noobs2ninjas"
];


const defaultErrorMessage: string = "Unidentified error"; // If API returns an error without a message
const infoBoxIDPrefix: string = "info-";

// Test data
const offlineDummy: APIReturn = {
  stream: null
};

const notFoundDummy: APIReturn = {
  error: "Not Found",
  message: "Channel 'suqkjfhkqjfh' does not exist",
  status: 404
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
      followers: 33864
    }
  }
};

const offlineTestMap: Map<string, APIReturn> = new Map([
      ["abconline", onlineDummy],
      ["defnotfound", notFoundDummy],
      ["ghioffline", offlineDummy]
]);

// Palette of [colour, background-colour] pairs o use for channels - taken from clrs.cc
const colours: [string, string][] = [
/* navy */ // ["#7FDBFF", "#001F3F"], too dark
/* blue */ // ["black", "#0074D9"],
/* aqua */ ["black", "#7FDBFF"],
/* teal */ ["black", "#39CCCC"],
/* olive */ // "#3D9970", removed as clashes with header
/* green */ ["black", "#2ECC40"],
/* lime */ ["black", "#01FF70"],
/* yellow */ ["black", "#FFDC00"],
/* orange */ ["black", "#FF851B"],
/* red */ ["black", "#FF4136"]
/* fuchsia */ // ["black", "#F012BE"] too dark/ugly
/* purple */ // ["black", "#B10DC9"], too dark/ugly
/* maroon */ // ["white", "#85144B"],too dark/ugly
/* white */ // ["white", "#FFFFFF"]
/* silver */ // "#DDDDDD",
/* gray */ // "#AAAAAA",
/* black */ // "#111111"
];
const offlineColours: [string, string] = ["black", "#DDDDDDD"];


/*
 *
 * Start-up code to set up our event listeners
 *
 */


run_when_document_ready((): void => {

  // We use this variable to hold our programme state - it is passed to and modified by
  // sevral of our main functions. Here we set up the basic values
  let trackedChannels: Map<string, APIReturn> = initializeTrackedChannels();

  setupHandlers(trackedChannels);

  fetchChannels(trackedChannels)
    .then((): void => updateDOM(trackedChannels));

});


/*
 *
 * Types
 *
 */


// Type for the parsed API return for an offline stream
interface APIReturn {
  error?: string;
  message?: string;
  status?: number;
  stream?: null | Stream;
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
}

interface Channel {
  mature: boolean;
  status: string;
  broadcaster_language: string; // e.g. "en"
  display_name: string;
  game: string;
  language: string; // e.g., "en",
  _id: number;
  name: string;
  created_at: string; // ISO Date format
  updated_at: string; // ISO Date format
  logo: string; // URL for image
  banner: null | string; // URL for image
  video_banner: string; // URL for image
  profile_banner: string; // URL for image
  partner: boolean;
  url: string;
  views: number;
  followers: number;
}


/*
 *
 * Main working functions
 *
 */

function initializeTrackedChannels(): Map<string, APIReturn> {

  // If we are in offlineTestMode, just return dummy values
  if (offlineTestMode) {
    return offlineTestMap;
  }

  // If we have storage available and a valid stored value, use it
  if (storageAvailable("localStorage")) {
    try {
      let stored: string[] = JSON.parse(localStorage.getItem(localStorageKey));
      console.log("Read from localStorage", stored);
      if (stored && Array.isArray(stored)) {
        return new Map(stored.map((channelName: string): [string, APIReturn] => [channelName, offlineDummy]));
      }
    } catch (e) {
      console.log("Caugght in storage getting/parsing", e);
    }
  } else {
      console.log("No storage to read");
  }

  // Otherwise, start with the defaults
  return new Map(defaultChannels.map((channelName: string): [string, APIReturn] => [channelName, offlineDummy]));

}


  // TODO Sort out not doing this until all of trackedChannels is setup

  //

function setupHandlers(channels: Map<string, APIReturn>): void {

  let onlineFilter: HTMLInputElement = document.getElementById("online-filter") as HTMLInputElement;
  onlineFilter.addEventListener("click", (): void => {
    console.log("onlineFilter", onlineFilter.checked);
    if (channels) {
      updateDOM(channels);
    }
  });

  document.querySelector("#refresh-control").addEventListener("click", () => {
    console.log("Calling refresh with", channels);
    fetchChannels(channels)
      .then((): void => updateDOM(channels));
  });

  document.querySelector("#add-control").addEventListener("click", (): void => {
    let bottom: HTMLElement = document.getElementById("bottom-box");
    console.log("Clicked added", bottom.style, bottom.style.display, "!");
    bottom.style.display = bottom.style.display === "block" ? "none" : "block";
    document.getElementById("add-input").focus();
  });

  document.querySelector(".add-form").addEventListener("submit", (event: Event): void => {
    let input: HTMLInputElement = document.getElementById("add-input") as HTMLInputElement;
    if (channels) {
      addChannel(channels, input.value);
      input.value = "";
    }
    event.preventDefault();
  });

  document.querySelector("#add-file").addEventListener("change", (event: Event): void => {
    let target: HTMLInputElement = event.target as HTMLInputElement;
    let fileList: FileList = target.files;
    addChannelsFromFile(channels, fileList);
    target.value = ""; // Remove the filename shown in the control
  });

}



// Use the API to update the given map (or create a new one if we are given an array of names)
function fetchChannels(channels: Map<string, APIReturn>): Promise<void> {

    // Do nothing if we are offline
    if (offlineTestMode) {
      return Promise.resolve();
    }

    // Launch one async call for each tracked channel
    let keyValuePromises: Promise<[string, APIReturn]>[] =
      Array.from(channels.keys()).map((channelName: string): Promise<[string, APIReturn]> =>
        jsonp<APIReturn>(apiPrefix + channelName + apiSuffix)
          .then((apiReturn: APIReturn): [string, APIReturn] => {
            console.log("Returned from", channelName, apiReturn);
            return [channelName, apiReturn];
          }));

    // When all async calls have returned, update the channels object and then the DOM
    return Promise.all(keyValuePromises)
      .then((kvs: [string, APIReturn][]): void => {
        console.log("All resolved", kvs);
        kvs.forEach((pair: [string, APIReturn]): void => {
          channels.set(pair[0], pair[1]);
        });
      });

}


function saveChannels(channels: Map<string, APIReturn>): void {
  if (storageAvailable("localStorage")) {
    let keys: string[] = Array.from(channels.keys());
    localStorage.setItem(localStorageKey, JSON.stringify(keys));
    console.log("Wrote to localStorage", keys);
  } else {
    console.log("No storage to write to");
  }
}

// Update the search-results div in the DOM with the new search results
function updateDOM(channels: Map<string, APIReturn>): void {

  const list: Element = document.querySelector(".list");

  // Remove any old search results
  while (list.firstChild) {
    list.removeChild(list.firstChild);
  }

  let colIndex: number = 0;

  // Add each of the search results
  let channelsShown: number = 0;
  channels.forEach((res: APIReturn, channelName: string): void => {

    if (res.error) {
      if (!(document.getElementById("online-filter") as HTMLInputElement).checked) {
        list.appendChild(createChannel(channelName, channels, res.message || defaultErrorMessage, offlineColours));
        channelsShown++;
      }
    } else if (!res.stream) {
      if (!(document.getElementById("online-filter") as HTMLInputElement).checked) {
        list.appendChild(createChannel(channelName, channels, "", offlineColours));
        channelsShown++;
      }
    } else {
      list.appendChild(createChannel(channelName, channels, res.stream, colours[colIndex]));
      colIndex = (colIndex + 1) % colours.length;
      channelsShown++;
    }

  });

  console.log("Displaying", channelsShown);
  if (channelsShown === 0) {
    let msg: HTMLDivElement = document.createElement("div");
    msg.className = "no-channels-message-box";
    msg.appendChild(document.createTextNode("No tracked channels"));
    list.appendChild(msg);
  }

  // Add dummy channels at the end
  for (let i: number = 0; i < 4; i++) {
    list.appendChild(createDummyChannel());
  }

}

// Create a DOM node representing a channel, takes the name of the channel and either its
// Stream or an error message (an empty string if offline)
function createChannel(channelName: string, channels: Map<string, APIReturn>, stream: Stream | string, col: [string, string]): Node {

  // Top-level box
  let box: HTMLDivElement = document.createElement("div");
  box.className = "channel " + (typeof stream === "string" ? (stream === "" ? "offline" : "error") : "online");
  box.style.color = col[0];
  box.style.backgroundColor = col[1];

  // Top part of box is always visible - logo on the left (if online), name on right
  let topBox: HTMLDivElement = document.createElement("div");
  topBox.className = "channel-top";
  box.appendChild(topBox);
  let leftBox: HTMLDivElement = document.createElement("div");
  leftBox.className = "channel-top-left";
  if (!offlineTestMode && typeof stream !== "string" && stream.channel && stream.channel.logo) {
      let logo: HTMLImageElement = document.createElement("img");
      logo.className = "channel-logo";
      logo.src = stream.channel.logo;
      leftBox.appendChild(logo);
  }
  topBox.appendChild(leftBox);
  let rightBox: HTMLDivElement = document.createElement("div");
  rightBox.className = "channel-top-right";
  let anchor: HTMLAnchorElement | null = null;
  if (typeof stream === "string") {
    let text: string = stream === "" ? channelName : (stream + " (" + channelName + ")");
    rightBox.appendChild(document.createTextNode(text));
  } else {
    anchor = document.createElement("a");
    anchor.className = "channel-link";
    anchor.style.color = col[0];
    anchor.appendChild(document.createTextNode(stream.channel.name));
    anchor.href = stream.channel.url;
    rightBox.appendChild(anchor);
  }
  box.addEventListener("click", (ev: Event): void => {
    if (ev.target !== anchor) { // Reveal the info box unless the click was on the anchor link
      let e: HTMLElement = document.getElementById(infoBoxIDPrefix + channelName);
      if (e) {
        e.style.display = e.style.display === "none" ? "flex" : "none";
      }
    }
  });

  topBox.appendChild(rightBox);

  // Bottom part has its display changed on click
  let infoBox: HTMLDivElement = document.createElement("div");
  infoBox.className = "channel-info" + (typeof stream === "string" ? " offline" : "");
  infoBox.id = infoBoxIDPrefix + channelName;
  infoBox.style.display = "none";
  if (typeof stream !== "string") {
    addInfoItem(infoBox, "Game", stream.channel.game);
    addInfoItem(infoBox, "Status", stream.channel.status);
    addInfoItem(infoBox, "Viewers", stream.viewers.toString());
    // addInfoItem(infoBox, "Delay", stream.channel.delay || "-");
    addInfoItem(infoBox, "Video", stream.video_height + "px, " + stream.average_fps.toFixed(0) + "fps");
  }
  let removeBox: HTMLDivElement = document.createElement("div");
  removeBox.className = "remove-box";
  let removeIcon: HTMLElement = document.createElement("i");
  removeIcon.className = "fa fa-times remove-icon";
  removeBox.appendChild(removeIcon);
  let removeLabel: HTMLSpanElement = document.createElement("span");
  removeLabel.className = "remove-label";
  removeLabel.appendChild(document.createTextNode("Remove channel"));
  removeBox.appendChild(removeLabel);
  infoBox.appendChild(removeBox);
  removeIcon.addEventListener("click", (): void => {
    removeChannel(channels, channelName);
  });
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

// Create a DOM node for a dummy channel (used to make bottom row of channels have equal width as others)
function createDummyChannel(): Node {

  let box: Element = document.createElement("div");
  box.className = "channel dummy";

  return box;

}

function addChannel(subs: Map<string, APIReturn>, newChannel: string): void {
  console.log("Adding", newChannel);
  let cleanedName = newChannel.trim().toLowerCase();
  if (!subs.has(cleanedName)) {
    subs.set(cleanedName, offlineDummy);
    saveChannels(subs);
    fetchChannels(subs)
      .then((): void => updateDOM(subs));
    updateDOM(subs);
  }
}

function removeChannel(channels: Map<string, APIReturn>, channelName: string): void {
  channels.delete(channelName);
  saveChannels(channels);
  updateDOM(channels);
}

function addChannelsFromFile(channels: Map<string, APIReturn>, files: FileList): void {

  if (files.length === 0) {
    console.log("Empty FileList in addChannelsFromFile");
    return;
  } else if (files.length > 1) {
    console.log("Unexpected extra files ignored in addChannelsFromFile", files.length);
  }

  let file: File = files.item(0);
  console.log("About to read from", file.name);

  let reader: FileReader = new FileReader();
  reader.onload = (): void => {
    let fileContents: string = reader.result;
    console.log("Reading from", fileContents);
    let newChannels: string[] = fileContents
      .split("\n")
      .map((name: string): string => name.trim().toLowerCase())
      .filter((name: string): boolean => name !== "");
    console.log("Adding", newChannels);
    newChannels.forEach((name: string): void => {
      channels.set(name, offlineDummy);
    });
    saveChannels(channels);
    fetchChannels(channels)
      .then((): void => updateDOM(channels));
  };
  reader.readAsText(file);
}


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
function jsonp<T>(url: string): Promise<T> {

  console.log("Called jsonp for", url);

  return new Promise((resolve: (r: T) => void) => {

    // Create a random name for the callback function (so we can create many of them indpendently)
    let callbackName: string = `callback_jsonp_${Date.now()}_${Math.ceil(Math.random() * 100000)}`;

    // Add our callback function to the global window object which handles the JSON response from the URL
    (window as any)[callbackName] = function (response: T): void {

      // Pass the received JSON to the Promsie
      resolve(response);

      // Remove the script tag and the name in the the global window object
      const script: HTMLElement = document.getElementById(callbackName);
      document.getElementsByTagName("head")[0].removeChild(script);
      delete (window as any)[callbackName];
    };

    // Add a script object to our document which will call our callback
    const script: HTMLElement = document.createElement("script");
    script.setAttribute("src", url + callbackName);
    script.id = callbackName;
    document.getElementsByTagName("head")[0].appendChild(script);

  });
}


// Utility function from MDN that returns true if local storage is available (from MDN)
function storageAvailable(type: string): boolean {
  try {
    let storage: any = (window as any)[type];
    let x: string = "__storage_test__";
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return false;
  }
}
