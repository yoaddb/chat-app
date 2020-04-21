const socket = io();

//Elements
const $messageForm = document.querySelector("#form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $locationButton = document.querySelector("#loc");
const $messages = document.querySelector("#messages");
const $sidebar = document.querySelector("#sidebar");

//Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

//Options
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});

const autoscroll = () => {
  // New message element
  const $newMessage = $messages.lastElementChild;

  // Height of new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  //Visible height
  const visibleHeight = $messages.offsetHeight;

  //Height of messages container
  const containerHeight = $messages.scrollHeight;

  //How far have I scrolled?
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

socket.on("message", data => {
  console.log(data);

  const { username, text, createdAt } = data;
  const html = Mustache.render(messageTemplate, {
    username,
    message: text,
    time: moment(createdAt).format("H:mm A")
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("locationMessage", data => {
  console.log(data);
  const { username, url, createdAt } = data;

  const html = Mustache.render(locationTemplate, {
    username,
    url,
    time: moment(createdAt).format("H:mm A")
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  });
  $sidebar.innerHTML = html;
});

$messageForm.addEventListener("submit", e => {
  e.preventDefault();

  $messageFormButton.disabled = !$messageFormButton.disabled;

  socket.emit("sendMessage", $messageFormInput.value, message => {
    if (message) console.log(message);

    $messageFormButton.disabled = !$messageFormButton.disabled;
    $messageFormInput.value = "";
    $messageFormInput.focus();
  });
});

$locationButton.addEventListener("click", () => {
  if (!navigator.geolocation)
    return alert("Geolocation is not supported by your browser");

  $locationButton.disabled = !$locationButton.disabled;

  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;

    socket.emit("sendLocation", latitude, longitude, () => {
      console.log("Location shared!");

      $locationButton.disabled = !$locationButton.disabled;
    });
  });
});

socket.emit("join", { username, room }, err => {
  if (err) {
    alert(err);
    location.href = "/";
  }
});
