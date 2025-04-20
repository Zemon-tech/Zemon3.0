// Global Music Controller using Singleton pattern
// Manages audio playback across the application

let instance = null;

class MusicController {
  constructor() {
    if (instance) {
      return instance;
    }

    this.playlist = [];
    this.currentIndex = -1;
    this.currentTrack = null;
    this.audioElement = null;
    this.soundCloudWidget = null;
    this.youtubePlayer = null;
    this.youtubeReady = false;
    this.pendingYoutubeAction = null;
    this.isPlaying = false;
    this.activeSource = null; // 'upload', 'soundcloud', or 'youtube'
    this.onPlayCallback = null;
    this.onPauseCallback = null;
    this.onTrackChangeCallback = null;
    this.soundCloudInitialized = false;

    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      this.audioElement = new Audio();
      
      // Set up event listeners for the audio element
      this.audioElement.addEventListener('ended', () => this.next());
      this.audioElement.addEventListener('play', () => {
        this.isPlaying = true;
        if (this.onPlayCallback) this.onPlayCallback();
      });
      this.audioElement.addEventListener('pause', () => {
        this.isPlaying = false;
        if (this.onPauseCallback) this.onPauseCallback();
      });

      // YouTube API initialization
      if (window.YT) {
        this.youtubeReady = true;
      } else {
        // Setup callback for when YouTube API is ready
        window.onYouTubeIframeAPIReady = () => {
          this.youtubeReady = true;
          if (this.pendingYoutubeAction) {
            const { action, videoId } = this.pendingYoutubeAction;
            this.pendingYoutubeAction = null;
            
            if (action === 'load') {
              this._initYouTubePlayer(videoId);
            }
          }
        };
      }

      // SoundCloud API initialization
      this.setupSoundCloudAPI();
      
      // Check if SoundCloud API is available
      if (window.SC) {
        this.soundCloudInitialized = true;
      } else {
        // Create a handler for when SoundCloud API loads
        window.setupSoundCloudReady = () => {
          this.soundCloudInitialized = true;
        };
        
        // Manually add SoundCloud API script if not present
        if (!document.getElementById('soundcloud-sdk')) {
          const script = document.createElement('script');
          script.id = 'soundcloud-sdk';
          script.src = 'https://w.soundcloud.com/player/api.js';
          script.onload = () => {
            if (window.SC) {
              this.soundCloudInitialized = true;
              console.log('SoundCloud SDK loaded');
            }
          };
          document.body.appendChild(script);
        }
      }
    }

    instance = this;
  }

  setupSoundCloudAPI() {
    // Create a hidden container for SoundCloud iframe if it doesn't exist
    if (typeof document !== 'undefined') {
      // Check for existing container first
      let container = document.getElementById('soundcloud-container');
      
      // If container doesn't exist, create it
      if (!container) {
        container = document.createElement('div');
        container.id = 'soundcloud-container';
        container.style.display = 'none';
        container.style.position = 'fixed';
        container.style.top = '-9999px';
        container.style.left = '-9999px';
        document.body.appendChild(container);
        console.log('Created SoundCloud container');
      }
    }
  }

  // Load the playlist from the database
  setPlaylist(tracks) {
    this.playlist = tracks;
    if (this.playlist.length > 0 && this.currentIndex === -1) {
      this.currentIndex = 0;
    }
  }

  // Add a track to the playlist
  addTrack(track) {
    this.playlist.push(track);
    // If this is the first track, set it as current
    if (this.playlist.length === 1) {
      this.currentIndex = 0;
      this.currentTrack = track;
    }
  }

  // Load track by ID
  loadTrackById(id) {
    const index = this.playlist.findIndex(track => track.id === id);
    if (index !== -1) {
      this.currentIndex = index;
      this.loadTrack(this.playlist[index]);
    }
  }

  // Load a specific track
  loadTrack(track) {
    if (!track) return;
    
    // Stop any currently playing media
    try {
      this.stop();
    } catch (error) {
      console.warn('Error stopping current track:', error);
    }
    
    this.currentTrack = track;
    
    // Set active source based on track source
    this.activeSource = track.source;
    
    // Trigger callback if provided
    if (this.onTrackChangeCallback) {
      this.onTrackChangeCallback(track);
    }
    
    // Handle different source types
    switch (track.source) {
      case 'upload':
        this.loadUploadedTrack(track.url);
        break;
      case 'soundcloud':
        this.loadSoundCloudTrack(track.url);
        break;
      case 'youtube':
        this.loadYouTubeTrack(track.url);
        break;
    }
  }
  
  // Load uploaded track into audio element
  loadUploadedTrack(url) {
    if (this.audioElement) {
      this.audioElement.src = url;
      this.audioElement.load();
    }
  }
  
  // Load SoundCloud track
  loadSoundCloudTrack(url) {
    if (typeof window === 'undefined') return;
    console.log('Loading SoundCloud track:', url);
    
    // Ensure container is properly set up
    this.setupSoundCloudAPI();
    
    // Clean up any existing widget
    if (this.soundCloudWidget) {
      try {
        this.soundCloudWidget.pause();
        this.soundCloudWidget = null;
      } catch (e) {
        console.warn('Error cleaning up SoundCloud widget:', e);
      }
    }
    
    // Get the container for SoundCloud iframe
    const container = document.getElementById('soundcloud-container');
    if (!container) {
      console.error('SoundCloud container not available even after setup');
      return;
    }
    
    // Clear the container
    container.innerHTML = '';
    
    // Create a new iframe for SoundCloud
    const iframe = document.createElement('iframe');
    iframe.id = 'soundcloud-player';
    iframe.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=false&buying=false&sharing=false&download=false&show_artwork=true&show_playcount=false&show_user=false&hide_related=true`;
    iframe.width = "100%";
    iframe.height = "166";
    iframe.frameBorder = "no";
    iframe.allow = "autoplay";
    container.appendChild(iframe);
    
    const createWidget = () => {
      if (window.SC && window.SC.Widget) {
        try {
          console.log('Initializing SoundCloud widget');
          this.soundCloudWidget = window.SC.Widget(iframe);
          
          // Set up event listeners
          this.soundCloudWidget.bind(window.SC.Widget.Events.READY, () => {
            console.log('SoundCloud widget ready');
            if (this.isPlaying) {
              setTimeout(() => {
                this.soundCloudWidget.play();
              }, 100);
            }
          });
          
          this.soundCloudWidget.bind(window.SC.Widget.Events.FINISH, () => this.next());
          this.soundCloudWidget.bind(window.SC.Widget.Events.PLAY, () => {
            this.isPlaying = true;
            if (this.onPlayCallback) this.onPlayCallback();
          });
          this.soundCloudWidget.bind(window.SC.Widget.Events.PAUSE, () => {
            this.isPlaying = false;
            if (this.onPauseCallback) this.onPauseCallback();
          });
        } catch (e) {
          console.error('Error initializing SoundCloud widget:', e);
        }
      } else {
        console.warn('SoundCloud SDK not available, retrying in 500ms');
        setTimeout(createWidget, 500);
      }
    };
    
    // Initialize SoundCloud Widget with retry logic
    if (window.SC && window.SC.Widget) {
      createWidget();
    } else {
      console.log('SoundCloud SDK not loaded yet, waiting...');
      // Add a script to load the SoundCloud SDK if not already present
      if (!document.getElementById('soundcloud-sdk')) {
        const script = document.createElement('script');
        script.id = 'soundcloud-sdk';
        script.src = 'https://w.soundcloud.com/player/api.js';
        script.onload = createWidget;
        document.body.appendChild(script);
      } else {
        // If the script is already there but not initialized, wait and retry
        setTimeout(createWidget, 1000);
      }
    }
  }
  
  // Load YouTube track
  loadYouTubeTrack(videoId) {
    if (typeof window === 'undefined') return;
    
    // Create YouTube player container if it doesn't exist
    if (!document.getElementById('youtube-player')) {
      const ytContainer = document.createElement('div');
      ytContainer.id = 'youtube-player';
      ytContainer.style.display = 'none';
      ytContainer.style.position = 'fixed';
      ytContainer.style.top = '-9999px';
      ytContainer.style.left = '-9999px';
      document.body.appendChild(ytContainer);
    }
    
    // Clean up any existing player
    if (this.youtubePlayer) {
      try {
        this.youtubePlayer.destroy();
      } catch (e) {
        console.warn('Error destroying YouTube player:', e);
      }
      this.youtubePlayer = null;
    }
    
    if (this.youtubeReady) {
      this._initYouTubePlayer(videoId);
    } else {
      // Queue this action for when YouTube API is ready
      this.pendingYoutubeAction = { action: 'load', videoId };
    }
  }
  
  _initYouTubePlayer(videoId) {
    try {
      const playerElement = document.getElementById('youtube-player');
      if (!playerElement) return;
      
      this.youtubePlayer = new window.YT.Player(playerElement, {
        height: '0',
        width: '0',
        videoId: videoId,
        playerVars: {
          'playsinline': 1,
          'controls': 0,
          'disablekb': 1
        },
        events: {
          'onReady': (event) => {
            // If this track was meant to start playing, play it now
            if (this.isPlaying && this.activeSource === 'youtube') {
              event.target.playVideo();
            }
          },
          'onStateChange': (event) => {
            // YouTube states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
            if (event.data === 0) {
              this.next();
            } else if (event.data === 1) {
              this.isPlaying = true;
              if (this.onPlayCallback) this.onPlayCallback();
            } else if (event.data === 2) {
              this.isPlaying = false;
              if (this.onPauseCallback) this.onPauseCallback();
            }
          }
        }
      });
    } catch (error) {
      console.error('Error initializing YouTube player:', error);
    }
  }

  // Play the current track
  play() {
    if (!this.currentTrack) {
      if (this.playlist.length > 0) {
        this.loadTrack(this.playlist[0]);
      } else {
        return;
      }
    }

    switch (this.activeSource) {
      case 'upload':
        if (this.audioElement) {
          try {
            this.audioElement.play();
          } catch (e) {
            console.warn('Error playing audio:', e);
          }
        }
        break;
      case 'soundcloud':
        if (this.soundCloudWidget) {
          try {
            console.log('Playing SoundCloud track');
            this.soundCloudWidget.play();
          } catch (e) {
            console.warn('Error playing SoundCloud track:', e);
          }
        } else {
          console.warn('SoundCloud widget not initialized');
          // If widget isn't initialized, set isPlaying to true so it will play when ready
          this.isPlaying = true;
          // Reload the track to initialize the widget
          this.loadSoundCloudTrack(this.currentTrack.url);
        }
        break;
      case 'youtube':
        if (this.youtubePlayer && this.youtubePlayer.playVideo) {
          try {
            this.youtubePlayer.playVideo();
          } catch (e) {
            console.warn('YouTube playVideo error:', e);
          }
        } else {
          // Set isPlaying to true so when the player is ready, it will start playing
          this.isPlaying = true;
        }
        break;
    }
    
    this.isPlaying = true;
  }

  // Pause the current track
  pause() {
    switch (this.activeSource) {
      case 'upload':
        if (this.audioElement) {
          try {
            this.audioElement.pause();
          } catch (e) {
            console.warn('Error pausing audio:', e);
          }
        }
        break;
      case 'soundcloud':
        if (this.soundCloudWidget) {
          try {
            this.soundCloudWidget.pause();
          } catch (e) {
            console.warn('Error pausing SoundCloud track:', e);
          }
        }
        break;
      case 'youtube':
        if (this.youtubePlayer && this.youtubePlayer.pauseVideo) {
          try {
            this.youtubePlayer.pauseVideo();
          } catch (e) {
            console.warn('YouTube pauseVideo error:', e);
          }
        }
        break;
    }
    
    this.isPlaying = false;
  }

  // Toggle play/pause
  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  // Stop playback
  stop() {
    switch (this.activeSource) {
      case 'upload':
        if (this.audioElement) {
          try {
            this.audioElement.pause();
            this.audioElement.currentTime = 0;
          } catch (e) {
            console.warn('Error stopping audio:', e);
          }
        }
        break;
      case 'soundcloud':
        if (this.soundCloudWidget) {
          try {
            this.soundCloudWidget.pause();
            // SoundCloud doesn't have a direct "stop" method, so we seek to 0
            this.soundCloudWidget.seekTo(0);
          } catch (e) {
            console.warn('Error stopping SoundCloud track:', e);
          }
        }
        break;
      case 'youtube':
        if (this.youtubePlayer && this.youtubePlayer.stopVideo) {
          try {
            this.youtubePlayer.stopVideo();
          } catch (e) {
            console.warn('YouTube stopVideo error:', e);
          }
        }
        break;
    }
    
    this.isPlaying = false;
  }

  // Skip to the next track
  next() {
    if (this.playlist.length === 0) return;
    
    this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
    this.loadTrack(this.playlist[this.currentIndex]);
    this.play();
  }

  // Go to the previous track
  previous() {
    if (this.playlist.length === 0) return;
    
    this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
    this.loadTrack(this.playlist[this.currentIndex]);
    this.play();
  }

  // Set callback for when a track starts playing
  onPlay(callback) {
    this.onPlayCallback = callback;
  }

  // Set callback for when a track is paused
  onPause(callback) {
    this.onPauseCallback = callback;
  }

  // Set callback for when the current track changes
  onTrackChange(callback) {
    this.onTrackChangeCallback = callback;
  }

  // Get current track info
  getCurrentTrack() {
    return this.currentTrack;
  }

  // Check if audio is currently playing
  getIsPlaying() {
    return this.isPlaying;
  }
}

export const musicController = new MusicController(); 