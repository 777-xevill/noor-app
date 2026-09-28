# Sounds

## adhan.wav

The prayer-alert adhan: the opening four takbīr ("Allāhu akbar" ×4), 29.5 s, so it stays under
iOS's 30-second limit for notification sounds. The opening is the same for every prayer, Fajr included.

- Recording: "Beautiful adhan" by Adam-synagda, own work, 2022-04-29
- Source: https://commons.wikimedia.org/wiki/File:Beautiful_adhan.ogg
- License: CC0 1.0 (public domain dedication)
- Wording checked by transcription (Whisper medium): standard adhan — four opening takbīr,
  shahādatayn ×2, ḥayya ʿalā ṣ-ṣalāh ×2, ḥayya ʿalā l-falāḥ ×2, takbīr ×2, lā ilāha illā-llāh.
- Processing (ffmpeg): from 0.8 s for 29.5 s, mono, 70 Hz high-pass, 1.1 s fade-out on the
  natural decay of the fourth takbīr, loudness-normalised (EBU R128, −17 LUFS integrated,
  −1.5 dBTP), 32 kHz 16-bit PCM WAV.

Registered in app.json through the expo-notifications `sounds` option. Android notification
channels can't change their sound once created, so a different recording needs a new channel id
(see src/features/prayer/notifications.ts).
