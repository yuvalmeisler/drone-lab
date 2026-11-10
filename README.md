# סדנת הרחפנים · פירוק והרכבה

אתר לימוד לחיילים: סרטוני הדרכה לפירוק והרכבה של רכיבי רחפנים (EVO, AVATA, ALPHA, MATRICE 350, MAVIC 3), עם אמיר — המדריך הדיגיטלי.

## הרצה מקומית

```bash
npm install
npm run dev
```

## איפה התוכן

- כל הרחפנים והפירוקים: `src/data/drones.ts`
- הדמות של אמיר: `src/components/Amir.tsx` (+ `amir.css` לאנימציות)
- אמיר הצף והטיפים: `src/components/AmirGuide.tsx`

## הוספת סרטון לפירוק

1. שימו את הקובץ ב-`public/videos/` (למשל `public/videos/evo/props.mp4`).
2. ב-`src/data/drones.ts` הוסיפו לפירוק `video: '/videos/evo/props.mp4'` (או קישור YouTube).

כל הסרטונים באתר במבנה **רוחבי (1280×720)**. סרטון שצולם לאורך הופכים לרוחבי עם
`scripts/video/to-landscape.sh SRC OUT [SUBS.srt]` — הסרטון ממורכז על רקע מטושטש,
והכתוביות (אם יש) נכתבות ברוחב המלא בתחתית המסך.

## פריסה

`vercel --prod`
