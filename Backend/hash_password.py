import bcrypt

password = "Admin@26"

hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())

print(hashed.decode())