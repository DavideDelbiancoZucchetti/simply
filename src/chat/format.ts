/** 1234567 -> "1.2 MB" */
export const fmtSize = (b: number): string =>
  b < 1024 ? `${b} B` : b < 1048576 ? `${Math.round(b / 1024)} KB` : `${(b / 1048576).toFixed(1)} MB`;

/** 75 -> "1:15" */
export const fmtTime = (sec: number): string => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
