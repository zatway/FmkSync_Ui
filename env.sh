find "/usr/share/nginx/html" -type f -exec sed -i 's|'"PROD_ENV_VITE_BACKEND_ORIGIN"'|'"$PROD_ENV_VITE_BACKEND_ORIGIN"'|g' {} \;
find "/usr/share/nginx/html" -type f -exec sed -i 's|'"PROD_ENV_VITE_API_PREFIX"'|'"$PROD_ENV_VITE_API_PREFIX"'|g' {} \;
