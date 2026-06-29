# Mover Compás a su propio repositorio

Compás es un proyecto **autocontenido** (su propio `package.json`, `.gitignore`,
esquema, etc.). Vive temporalmente dentro del repo `cuentas-claras` solo porque
la sesión que lo creó estaba restringida a ese repo. Aquí tienes cómo sacarlo a
**su propio repositorio**, que es como debe estar.

## Opción A — Conservando el historial (recomendada)

```bash
# 1) Crea un repo VACÍO en GitHub (sin README ni .gitignore):
#    https://github.com/new   →   nombre: compas

# 2) En tu clon de cuentas-claras, extrae la carpeta compas/ con su historial:
git subtree split --prefix=compas -b compas-only

# 3) Empuja esa rama como 'main' del nuevo repo (pon TU usuario):
git push https://github.com/TU_USUARIO/compas.git compas-only:main

# 4) Clona ya el repo nuevo e instala:
git clone https://github.com/TU_USUARIO/compas.git
cd compas && npm install && npm run dev
```

## Opción B — Empezar limpio (sin historial)

```bash
# 1) Crea el repo vacío en GitHub: https://github.com/new → compas
# 2) Copia la carpeta a un sitio nuevo y arranca un repo desde cero:
cp -r compas ~/compas && cd ~/compas
rm -rf .git
git init && git add . && git commit -m "Compás — proyecto inicial"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/compas.git
git push -u origin main
```

## Después de mover

- Borra la carpeta `compas/` de `cuentas-claras` para que no quede duplicada.
- A partir de ahí, trabaja Compás **siempre en su propio repo**.
- Si vas a seguir el desarrollo con Claude Code, inicia la sesión apuntando al
  repo `compas` para que el trabajo vaya directo ahí (no a cuentas-claras).

> Regla del proyecto: **cada producto, su propio repositorio.** Nunca mezclar.
