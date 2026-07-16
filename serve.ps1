# Inicia o servidor PHP com limites de upload adequados para fotos de celular.
# Usa -d em vez de php.ini local para não desativar extensões (mbstring, gd, etc.).
Set-Location $PSScriptRoot
php -d upload_max_filesize=20M -d post_max_size=25M -d memory_limit=256M -S 127.0.0.1:8888 -t public
