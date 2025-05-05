export const mapAnswerToScorePHQ = (answer) => {
    const mapping = {
      "Never": 0,
      "Sometimes": 1,
      "Often": 2,
      "Almost Always": 3
    };
    return mapping[answer] ?? -1; 
  };

  export const mapAnswerToScoreCART = (cartAnswers) => {
    if (!Array.isArray(cartAnswers) || cartAnswers.length !== 13) {
      throw new Error("Jawaban harus berupa array dengan 13 elemen.");
    }
  
    return cartAnswers.map((answer, index) => {
      switch (index) {
        case 0: // Gender
          if (answer === "Female") return 0;
          if (answer === "Male") return 1;
          return -1;
  
        case 1: // self_employed
        case 2: // family_history
        case 4: // Growing_Stress
        case 5: // Changes_Habits
        case 6: // Mental_Health_History
        case 8: // Coping_Struggles
        case 9: // Work_Interest
        case 10: // Social_Weakness
          return answer === "Yes" ? 1 : 0;
  
        case 3: // Days_Indoors
          return answer === "More Than 14" ? 1 : 0;
  
        case 7: // Mood_Swings
          if (answer === "Rarely") return 1;
          if (answer === "Sometimes") return 2;
          if (answer === "Often") return 0;
          return -1;
  
        case 12: // care_options
          if (answer === "Yes") return 2;
          if (answer === "Not Sure") return 1;
          if (answer === "No") return 0;
          return -1;
  
        case 11: // mental_health_interview
          if (answer === "Yes") return 2;
          if (answer === "Maybe") return 1;
          if (answer === "No") return 0;
          return -1;
  
        default:
          return -1;
      }
    });
  };
  
  