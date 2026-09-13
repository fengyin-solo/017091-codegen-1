FROM nginx:alpine
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
COPY frontend-admin /usr/share/nginx/html
ENTRYPOINT ["/entrypoint.sh"]
