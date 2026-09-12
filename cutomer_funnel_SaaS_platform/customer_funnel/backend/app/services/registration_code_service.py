import secrets
import string


def generate_registration_code() -> str:
    chars = string.ascii_uppercase + string.digits

    part1 = "".join(secrets.choice(chars) for _ in range(4))
    part2 = "".join(secrets.choice(chars) for _ in range(4))
    part3 = "".join(secrets.choice(chars) for _ in range(4))

    return f"GBRU-{part1}-{part2}-{part3}"