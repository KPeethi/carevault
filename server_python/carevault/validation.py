def clean(value) -> str:
    if isinstance(value, list):
        return ", ".join(clean(item) for item in value)
    return str(value or "").strip()


def pick(source, keys):
    return {key: clean(source.get(key)) for key in keys}


def require_fields(payload, fields):
    missing = [field for field in fields if not payload.get(field)]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")


def require_at_least_one_field(payload, fields, label):
    if not any(payload.get(field) for field in fields):
        raise ValueError(f"Missing required field: {label}")
