/*
 *
 * Global constants
 *
 */


const apiPrefix: string = "https://api.twitch.tv/kraken/streams/";
const apiSuffix: string = "?callback="; // Name of the callback is added by fetchJSONP
const localStorageKey: string = "channelNames";
const infoBoxIDPrefix: string = "info-";

/** Channels used on first startup (based on freecodecamp suggestions) */
const defaultChannels: string[] = [
  "esl_sc2", "ogamingsc2", "cretetion", "freecodecamp",
  "storbeck", "habathcx", "robotcaleb", "noobs2ninjas"
];

/** Used for channels before the API returns (same value as API returns for a channel that is offline) */
const nullAPIReturn: APIReturn = {
  stream: null
};

/** Palette of background-colours to use for online channels - taken from clrs.cc */
const channelColours: string[] = [
  "#7FDBFF", "#39CCCC", "#2ECC40", "#01FF70", "#FFDC00", "#FF851B", "#FF4136"
];

/** Background colour to use for offline channels */
const offlineChannelColour: string = "#DDDDDDD";

/**  Foreground colour for channels */
const channelForeground: string = "black";


/*
 *
 * Types
 *
 */


interface APIReturn {
  error?: string;
  message?: string;
  status?: number;
  stream?: null | Stream;
}

interface Stream {
  game: string;
  viewers: number;
  average_fps: number;
  delay: number;
  video_height: number;
  created_at: string; // ISO date format, e.g., "2015-02-12T04:42:31Z",
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
 * Start-up code
 *
 */


run_when_document_ready((): void => {

  // We use this variable to hold our programme state - it is passed to and modified by
  // sevral of our main functions. Here we set up the basic values
  // Keys are all held in lower case
  let trackedChannels: Map<string, APIReturn> = initializeTrackedChannels();

  setupHandlers(trackedChannels);

  fetchChannels(trackedChannels)
    .then((): void => updateDOM(trackedChannels));

});



/*
 *
 * Top-level functions
 *
 */


/** Create our map of tracked channels and set up with saved or default names and null APIReturns */
function initializeTrackedChannels(): Map<string, APIReturn> {

  // If we have storage available and a valid stored value, use it
  if (storageAvailable("localStorage")) {
    try {
      let stored: string[] = JSON.parse(localStorage.getItem(localStorageKey));
      if (stored && Array.isArray(stored)) {
        return new Map(stored.map((channelName: string): [string, APIReturn] => [channelName, nullAPIReturn]));
      }
    } catch (e) {
      console.log("Caught in storage getting/parsing", e);
    }
  }

  // Otherwise, start with the defaults
  return new Map(defaultChannels.map((channelName: string): [string, APIReturn] => [channelName, nullAPIReturn]));

}

/** Attach handlers to the DOM */
function setupHandlers(channels: Map<string, APIReturn>): void {

  // Filter buttons toggles between showing all channels or only those which are online
  (document.querySelector("#online-filter") as HTMLInputElement).addEventListener("click", (): void => {
      updateDOM(channels);
  });

  // Refresh button re-fetches the tracked channels from the API and redraws the screen
  document.querySelector("#refresh-control").addEventListener("click", (): void => {
    fetchChannels(channels)
      .then((): void => updateDOM(channels));
  });

  // Add button toggles displaying the pane for adding new channels
  document.querySelector("#add-control").addEventListener("click", (): void => {
    let bottom: HTMLElement = document.getElementById("bottom-box");
    bottom.style.display = bottom.style.display === "block" ? "none" : "block";
    document.getElementById("add-input").focus();
  });

  // Submit on add form allows a channel to be added
  document.querySelector(".add-form").addEventListener("submit", (event: Event): void => {
    let input: HTMLInputElement = document.getElementById("add-input") as HTMLInputElement;
    if (channels) {
      addChannel(channels, input.value);
      saveChannels(channels);
      fetchChannels(channels)
        .then((): void => updateDOM(channels));
    }
    input.value = "";
    event.preventDefault();
  });

  // Add file input reads a text file and adds each line as a channel
  document.querySelector("#add-file").addEventListener("change", (event: Event): void => {
    let target: HTMLInputElement = event.target as HTMLInputElement;
    let fileList: FileList = target.files;
    addChannelsFromFileHandler(channels, fileList)
      .then((): Promise<void> => {
        saveChannels(channels);
        return fetchChannels(channels);
      })
      .then((): void => {
        updateDOM(channels);
        target.value = ""; // Remove the filename shown in the control
      });
  });

  // Share takes the list of tracked channels and puts onto the clipboard to allow for relatvely easy exporting
  document.querySelector("#share-control").addEventListener("click", (): void => {
    let exportText: string = Array.from(channels.keys()).join("\n");
    window.prompt("Text below is ready for copy/paste:", exportText);
  });
}

/** Use the API to update our tracked channels */
function fetchChannels(channels: Map<string, APIReturn>): Promise<void> {

    // Launch one async call for each tracked channel
    let keyValuePromises: Promise<[string, APIReturn]>[] =
      Array.from(channels.keys()).map((channelName: string): Promise<[string, APIReturn]> =>
        jsonp<APIReturn>(apiPrefix + channelName + apiSuffix)
          .then((apiReturn: APIReturn): [string, APIReturn] => [channelName, apiReturn]));

    // Complete when all async calls have returned
    return Promise.all(keyValuePromises)
      .then((kvs: [string, APIReturn][]): void => {
        kvs.forEach((pair: [string, APIReturn]): void => {
          channels.set(pair[0], pair[1]);
        });
      });

}


/**
 *
 * View functions (which update the DOM)
 *
 *
 */


/** Update the .lists div in the DOM with the the given channel values */
function updateDOM(channels: Map<string, APIReturn>): void {

  const list: Element = document.querySelector(".list");

  // Remove any old search results
  while (list.firstChild) {
    list.removeChild(list.firstChild);
  }

  /** Colour to use for the next online channel */
  let colIndex: number = 0;

  // Add each of the search results
  let channelsShown: number = 0;
  channels.forEach((res: APIReturn, channelName: string): void => {

    if (res.error) {
      console.log(channelName, "gave error", res);
      if (!(document.getElementById("online-filter") as HTMLInputElement).checked) {
        list.appendChild(createChannel(
          channels, channelName, offlineChannelColour,
          `${res.message} (${res.status}, ${res.error}, ${channelName})`));
        channelsShown++;
      }
    } else if (!res.stream) {
      if (!(document.getElementById("online-filter") as HTMLInputElement).checked) {
        list.appendChild(createChannel(channels, channelName, offlineChannelColour, channelName));
        channelsShown++;
      }
    } else {
      list.appendChild(createChannel(channels, channelName, channelColours[colIndex]));
      colIndex = (colIndex + 1) % channelColours.length;
      channelsShown++;
    }

  });

  if (channelsShown === 0) {
    let msg: HTMLDivElement = document.createElement("div");
    msg.className = "no-channels-message-box";
    msg.appendChild(document.createTextNode("No tracked channels"));
    list.appendChild(msg);
  }

  // Add dummy channels at the end so that the bottom row is filled and its channels are not too narrow
  for (let i: number = 0; i < 4; i++) {
    let dummyBox: Element = document.createElement("div");
    dummyBox.className = "channel dummy";
    list.appendChild(dummyBox);
  }

}

/** Create a DOM node representing a channel that shows either the message if given or the stored value from the API */
function createChannel(channels: Map<string, APIReturn>, channelName: string,  bgColour: string, message?: string): Node {

  // Extract components of the channel's API informations
  let apiReturn: APIReturn | undefined = channels.get(channelName);
  let stream: Stream | undefined = (apiReturn && apiReturn.stream) ? apiReturn.stream : undefined;
  let channel: Channel | undefined = (stream && stream.channel) ? stream.channel : undefined;

  // Top-level box
  let box: HTMLDivElement = document.createElement("div");
  box.className = "channel " + (typeof message === "string" ? (message === "" ? "offline" : "error") : "online");
  box.style.color = channelForeground;
  box.style.backgroundColor = bgColour;

  // Top part of box is always visible - logo on the left (if online), name on right
  let topBox: HTMLDivElement = document.createElement("div");
  topBox.className = "channel-top";
  box.appendChild(topBox);
  let leftBox: HTMLDivElement = document.createElement("div");
  leftBox.className = "channel-top-left";
  if (channel && channel.logo) {
      let logo: HTMLImageElement = document.createElement("img");
      logo.className = "channel-logo";
      logo.src = channel.logo;
      leftBox.appendChild(logo);
  }
  topBox.appendChild(leftBox);
  let rightBox: HTMLDivElement = document.createElement("div");
  rightBox.className = "channel-top-right";
  let anchor: HTMLAnchorElement | null = null;
  if (stream) {
    anchor = document.createElement("a");
    anchor.className = "channel-link";
    anchor.style.color = channelForeground;
    // Label is the returned display_name (which is capitalized) if available, or the requested (down-cased) key if not
    anchor.appendChild(document.createTextNode(stream.channel.display_name || channelName));
    anchor.href = stream.channel.url;
    rightBox.appendChild(anchor);
  } else {
    rightBox.appendChild(document.createTextNode(message || channelName));
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
  if (stream) {
    addInfoItem(infoBox, "Game", stream.channel.game);
    addInfoItem(infoBox, "Status", stream.channel.status);
    addInfoItem(infoBox, "Viewers", stream.viewers.toString());
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
    saveChannels(channels);
    updateDOM(channels);
  });
  box.appendChild(infoBox);

  return box;

}

/** Add a child node with the given channel tag and content information */
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
 * Handler functions
 *
 */


/** Handle request to add channels form the single file in the given FileList */
function addChannelsFromFileHandler(channels: Map<string, APIReturn>, files: FileList): Promise<void> {

  return new Promise<void>((resolve: () => void, reject: (reason: any) => void): void => {

    if (files.length === 0) {
      reject(Error("Empty FileList in addChannelsFromFile"));
    }

    let file: File = files.item(0);
    let reader: FileReader = new FileReader();
    reader.onload = (): void => {
      let fileContents: string = reader.result;
      let newChannels: string[] = fileContents
        .split("\n")
        .filter((name: string): boolean => name.trim() !== "");
      newChannels.forEach((name: string): void => {
        addChannel(channels, name);
      });

    };
    reader.readAsText(file);
    resolve();

  });

}


/*
 *
 * Helper functions
 *
 */

/** Add the given channel to our tracked channels */
function addChannel (channels: Map<string, APIReturn>, newChannel: string): void {

  let cleanedName: string = newChannel.trim().toLowerCase();
  if (!channels.has(cleanedName)) {
    channels.set(cleanedName, nullAPIReturn);
  }

}

/** Remove the given channel from our tracked channels */
function removeChannel(channels: Map<string, APIReturn>, channelName: string): void {

  channels.delete(channelName.trim().toLowerCase());

}


/** Save the names of our tracked channels into localStorage if we can */
function saveChannels(channels: Map<string, APIReturn>): void {

  if (storageAvailable("localStorage")) {
    let keys: string[] = Array.from(channels.keys());
    localStorage.setItem(localStorageKey, JSON.stringify(keys));
  }

}



/*
 *
 * Library functions
 *
 */


/** Run the given function when document load is complete */
function run_when_document_ready(fn: () => void): void {

  if (document.readyState !== "loading") {
    fn();
  } else {
    document.addEventListener("DOMContentLoaded", fn);
  }

}

/**
 * Simple function to make a jsonp request and wrap in a Promise
 *
 * Url paramater will have the name of the callback appended
 * Adapted from https://github.com/camsong/fetch-jsonp
 */
function jsonp<T>(url: string): Promise<T> {

  return new Promise<T>((resolve: (r: T) => void): void => {

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


/** Utility function from MDN that returns true if local storage is available (from MDN) */
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
