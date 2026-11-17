# Studio stories

Put portrait photos or videos in the matching `work-in-progress/` or `live-moments/` folder, then add one entry per story to `../../stories.js`. Every entry creates its own circle.

```js
{
  id: 'wip-01',
  category: 'work-in-progress',
  type: 'image',
  src: 'assets/stories/work-in-progress/01.jpg',
  alt: 'A new interface taking shape',
  caption: 'A new interface taking shape',
}
```

For video, use `type: 'video'`, set `src` to an MP4 or WebM file, and optionally provide a `poster` image. Use `category: 'live-moments'` for live moments. In the viewer, each story advances automatically after 5 seconds by default; set `duration` in milliseconds to change that. Videos advance when playback ends. Viewers can also move between circles manually.

The photo (or video's poster) is used as the circle cover. When publishing a changed story list, update the `stories.js?v=` value in `promo/index.html` to refresh cached data.
