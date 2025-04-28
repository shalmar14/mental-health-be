export const mapAnswerToScorePHQ = (answer) => {
    const mapping = {
      "Tidak Pernah": 0,
      "Kadang-kadang": 1,
      "Sering": 2,
      "Hampir Setiap Hari": 3
    };
    return mapping[answer] ?? -1; // -1 jika tidak valid
  };

 export const mapAnswerToScoreCART = (answer) => {
    switch (answer) {
      case "Tidak Pernah":
        return 6;
      case "Kadang-kadang":
        return 5;
      case "Sering":
        return 3;
      case "Hampir Setiap Hari":
        return 2;
      default:
        return -1; // untuk validasi
    }
 }
  