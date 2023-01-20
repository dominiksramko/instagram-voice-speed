(function() {
  let playbackRate = 1.00;
  const buttonClassName = 'playback-rate-controller';
  const playbackRates = [
    1.00,
    1.25,
    1.50,
    2.00
  ];

  const savePlaybackRate = function(playbackRate) {
    chrome.storage.local.set({ playbackRate });
  };

  const loadPlaybackRate = function() {
    chrome.storage.local
      .get(['playbackRate'])
      .then((result) => {
        if (result.playbackRate === undefined) {
          savePlaybackRate(playbackRate);
          return;
        }
        playbackRate = result.playbackRate;
      });
  };

  const getMessageNode = function(node, depth) {
    depth = depth === undefined ? 0 : depth;
    if (depth > 10) {
      console.error(`Failed to acquire message node after ${depth} attempts`);
      return null;
    }
    if (node.getAttribute('role') !== 'listbox') {
      return getMessageNode(node.parentElement, depth + 1);
    }
    return node;
  };

  const getAudioNode = function(buttonNode) {
    const audioNode = buttonNode.parentElement.querySelector('audio');
    if (!audioNode) {
      console.error('Failed to acquire audio node');
    }
    return audioNode;
  };

  const getButtonNode = function(audioNode) {
    const messageNode = getMessageNode(audioNode);
    if (!messageNode) return null;
    const buttonNode = messageNode.querySelector(`.${buttonClassName}`);
    if (!buttonNode) {
      console.error('Failed to acquire button node');
    }
    return buttonNode;
  };

  const getNextPlaybackRate = function() {
    const playbackRateIndex = playbackRates.indexOf(playbackRate);
    if (playbackRateIndex === playbackRates.length - 1) {
      return playbackRates[0];
    }
    return playbackRates[playbackRateIndex + 1];
  };

  const setButtonPlaybackRate = function(buttonNode, playbackRate) {
    buttonNode.innerHTML = `${playbackRate}×`;
  };

  const injectPlaybackRateController = function(node) {
    const div = document.createElement("button");
    div.classList.add(buttonClassName);
    setButtonPlaybackRate(div, playbackRate);
    div.onclick = (event) => {
      handlePlaybackRate(event.target);
      event.preventDefault();
    };
    node.prepend(div);
  };

  const handlePlay = function(audioNode) {
    const messageNode = getMessageNode(audioNode);
    if (!messageNode) return;
    injectPlaybackRateController(messageNode);
    audioNode.playbackRate = playbackRate;      
  };

  const handlePause = function(audioNode) {
    const buttonNode = getButtonNode(audioNode);
    if (buttonNode) {
      buttonNode.remove();
    }
  };

  const handlePlaybackRate = function(buttonNode) {
    const audioNode = getAudioNode(buttonNode);
    if (!audioNode) return;
    playbackRate = getNextPlaybackRate();
    audioNode.playbackRate = playbackRate;
    setButtonPlaybackRate(buttonNode, playbackRate);
    savePlaybackRate(playbackRate);
  };
   
  const onPlay = function(event) {
    handlePlay(event.target);
  };

  const onPause = function(event) {
    handlePause(event.target);
  };

  const tick = function() {
    const audioNodes = document.querySelectorAll('audio:not([data-ivs="true"])');
    for (let audioNode of audioNodes) {
      audioNode.dataset.ivs = true;
      audioNode.addEventListener('play', onPlay);
      audioNode.addEventListener('pause', onPause);
      if (!audioNode.paused && audioNode.currentTime > 0) {
        handlePlay(audioNode);
      }
    }
  };

  const startInterval = function() {
    setInterval(tick, 1000);
  };

  loadPlaybackRate();
  startInterval();
})();
