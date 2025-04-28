def calculate_phq9(scores):
    """
    Menghitung skor PHQ-9 berdasarkan input daftar skor (0-3 untuk setiap pertanyaan).
    """
    if len(scores) != 9 or not all(0 <= s <= 3 for s in scores):
        raise ValueError("Harap masukkan 9 nilai antara 0 dan 3 untuk setiap pertanyaan.")
    
    total_score = sum(scores)

    # Interpretasi skor
    if total_score <= 4:
        category = "Minimal atau tidak ada depresi"
    elif total_score <= 9:
        category = "Depresi ringan"
    elif total_score <= 14:
        category = "Depresi sedang"
    elif total_score <= 19:
        category = "Depresi cukup berat"
    else:
        category = "Depresi berat"

    return total_score, category


def get_phq9_scores():
    """
    Meminta pengguna mengisi skor PHQ-9 satu per satu.
    """
    scores = []
    print("Masukkan skor untuk 9 pertanyaan PHQ-9 (0=tidak pernah, 3=hampir setiap hari):")
    
    for i in range(1, 10):
        while True:
            try:
                score = int(input(f"Pertanyaan {i}: "))
                if 0 <= score <= 3:
                    scores.append(score)
                    break
                else:
                    print("Masukkan angka antara 0 hingga 3.")
            except ValueError:
                print("Harap masukkan angka.")
    
    return scores

# Mengambil input dari pengguna
user_scores = get_phq9_scores()
total, result = calculate_phq9(user_scores)
print(f"\nTotal Skor PHQ-9: {total}-{result}")