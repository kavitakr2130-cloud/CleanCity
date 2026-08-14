import bcrypt

passwords = [
    "SupRahul@26",
    "SupPriya@26",
    "WorkAmit#26",
    "WorkNeha#26",
    "WorkRohit#26",
    "WorkSneha#26"
]

print("\nGenerated Password Hashes:\n")

for pwd in passwords:
    hashed = bcrypt.hashpw(
        pwd.encode(),
        bcrypt.gensalt()
    ).decode()

    print(f"{pwd} -> {hashed}")