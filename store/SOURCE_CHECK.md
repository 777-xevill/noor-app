# Source check: Hajj guide and kids' prayer guide

Checked on 3 November 2026 by comparing each claim in `src/data/hajj.ts` and `src/data/kidsSalah.ts` with published
scholarly answers. **This is not a scholar's review.** Nobody qualified has read these guides, so the app says "compared
with scholars' published guides, not reviewed in person by a scholar". Only set `HAJJ_REVIEWED` or `KIDS_REVIEWED` to
true when a named scholar has read them.

Key to the sources:

- **A:** [Islam Q&A 31822, Description of Hajj](https://islamqa.info/en/answers/31822)
- **B:** [Islam Q&A 31819, What Is Umrah?](https://islamqa.info/en/answers/31819)
- **C:** [Islam Q&A 13340, Description of the Prophet's Prayer](https://islamqa.info/en/answers/13340)
- **D:** [Step-by-Step Prayer Guide, Hanafi](https://islamqa.org/?p=158064)
- **E:** [SeekersGuidance, farewell tawaf and menstruation, Hanafi](https://seekersguidance.org/answers/hanafi-fiqh/missing-the-farewell-tawaf-due-to-menstruation/)
- **F:** [Darul Ifta Birmingham, leaving Muzdalifah, Hanafi](https://daruliftabirmingham.co.uk/home/earliest-permissible-time-for-the-weak-ill-disabled-women-to-depart-from-muzdalifah)
- **G:** [Darul Ifta Trinidad, Hajj questions, Hanafi](https://fatwa-tt.com/index.php/hajj-related-questions/)
- **H:** [Tafseer Raheemi, shortening after 15 days in Makkah, Hanafi](https://islamqa.org/hanafi/tafseer-raheemi/51633/staying-in-makkah-more-then-15-days-which-includes-the-hajj-days-would-the-hajjis-pray-qasar-in-mina-arrafat-or-full-namaz-since-its-within-48miles-from-their-temporary-stay/)
- **I:** Combining at Arafah, Hanafi: [Mathabah](https://mathabah.org/combining-dhuhr-and-ʿaṣr-during-ḥajj-at-ʿarafah/), [Al-Balagh](https://islamqa.org/hanafi/albalagh/22144/combining-zuhr-and-asr-at-arafah/), [Islamic Portal](https://islamicportal.co.uk/combining-salah-in-arafah/)
- **J:** [Niqab and gloves hadith](https://en.tohed.com/hadith/bukhari/1838) and [Islam Q&A 234554](https://islamqa.info/en/answers/234554/ruling-on-putting-a-light-cover-over-the-niqab-so-that-it-no-longer-matches-the-description-of-the-niqab-that-a-woman-is-forbidden-to-wear-whilst-in-ihram)
- **K:** Periods and Tawaf al-Ifadah: [Hanafi answer](https://islamqa.org/hanafi/muftisays/9568/period-and-unable-to-perform-tawaf-ziyarah-can-woman-return-home/), [AboutIslam](https://aboutislam.net/counseling/ask-the-scholar/hajj/can-a-menstruating-woman-perform-tawaf-al-ifadah/)
- **L:** [Mufti of Federal Territory, Malaysia, farewell tawaf](https://muftiwp.gov.my/en/artikel/al-kafi-li-al-fatawi/2088-al-kafi-502-the-ruling-for-women-who-do-not-perform-tawaf-wida-due-to-menstruation)
- **M:** Flying and the miqat: [Saudi Presidency of Religious Affairs](https://risala.prh.gov.sa/storage/contents/940/en_sifat_alomrah_harmain.pdf), [IslamOnline](https://fiqh.islamonline.net/en/place-of-ihram-for-air-travelers)

## Umrah

| Claim | Matches |
|---|---|
| Ihram at the miqat, ghusl, talbiyah | B |
| **Men do not cover the head; the listed ihram prohibitions** | **Not listed in the pages read** |
| Women: no niqab or gloves; cover the face another way | J (scholars differ on the details) |
| Flying: enter ihram before crossing the miqat | M (a minority allow Jeddah) |
| Seven circuits, Kaaba on the left, from the Black Stone | B |
| Men: right shoulder uncovered, brisk first three circuits | B |
| Two rak'ahs behind the Maqam | B |
| Be in wudu for tawaf | [Al-Feqh](https://www.al-feqh.com/en/a-woman-began-menstruating-just-before-performing-tawaf-ul-ifadah-and-she-could-not-remain-in-makkah-because-she-had-to-leave-with-her-group) (purity as a condition; schools differ on how strictly) |
| **Drink Zamzam** | **Not found in the pages read** |
| A woman on her period waits to do tawaf | K |
| Sa'i: seven, Safa to Marwa, men quick between the markers | B |
| Men shave (better) or trim all over; women a fingertip's length | A, B |

## Hajj

| Claim | Matches |
|---|---|
| Tamattu', Qiran and Ifrad described | A (Qiran's single ihram isn't spelled out) |
| **Sacrifice required for Tamattu' and Qiran, not for Ifrad** | **Sacrifice shown in A, but "not required for Ifrad" not stated in the pages read** |
| 8th: ihram from where you stay, go to Mina, five prayers | A |
| Shortening at Mina; Hanafi 15-day rule | A, H (schools differ, as the guide says) |
| 9th: go after sunrise, stay from noon to sunset | A |
| Combining at Arafah; Hanafi disagreement | A, I (Hanafi sources differ, as the guide says) |
| Stay inside Arafah's boundaries | A ("all of Arafah is the place of standing") |
| Muzdalifah: Maghrib and Isha together, Fajr, dhikr, leave before sunrise | A |
| Women, elderly and sick may leave after midnight | F |
| 10th: stone seven with takbir, sacrifice, shave, then Tawaf al-Ifadah | A, G |
| Sa'i on the 10th for Tamattu', and Qiran or Ifrad if not done | A |
| Restrictions end except marital relations | A (not separately confirmed in a Hanafi source) |
| Hanafi: order required, breaking it carries a penalty | G |
| Tawaf al-Ifadah and periods | K |
| 11th and 12th: after noon, three pillars, seven each | A |
| May leave on the 12th before sunset, or stay for the 13th | A |
| Farewell tawaf last; excused on a period | A, E |
| ...unless she becomes clean before leaving Makkah | L |

## Kids' prayer guide

| Claim | Matches |
|---|---|
| **Wudu: hands, mouth, nose, face, arms, head, feet** | **C and D don't list the steps. Face, arms, head and feet are in Quran 5:6; hands, mouth and nose not checked in the pages read** |
| Face the Qibla; intention in the heart | C, and D for the intention |
| Opening takbir | C, D |
| Al-Fatiha, then another surah | C, D |
| Bow with a level back, words of praise | C, D |
| Rise upright | C, D |
| Forehead, nose, hands, knees, toes; sit; second sujood | C, and D for the steps |
| Next rak'ah repeats; sit for tashahhud after the second | C, D |
| Only Al-Fatiha in the third and fourth | C, D |
| Final tashahhud and salawat | C, D |
| Salam to the right and left | C, D |

## Result

37 of 41 claims (about 90%) matched a page that was actually read. The other 4, in bold, are standard teachings that weren't confirmed
in those pages. This counts agreement with published answers. It doesn't show that the guides are free of error.
