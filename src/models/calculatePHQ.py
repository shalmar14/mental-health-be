import sys
import json

def calculate_phq9(scores):
    if len(scores) != 9 or not all(0 <= s <= 3 for s in scores):
        raise ValueError("Please enter 9 numbers between 0 and 3.")

    total_score = sum(scores)

    if total_score <= 4:
        category = "None-minimal"
    elif total_score <= 9:
        category = "Mild"
    elif total_score <= 14:
        category = "Moderate"
    elif total_score <= 19:
        category = "Moderately severe"
    else:
        category = "Severe"

    return total_score, category

if __name__ == "__main__":
    try:
        input_data = json.loads(sys.argv[1])
        total, result = calculate_phq9(input_data)
        print(json.dumps({"total_score": total, "result": result}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
