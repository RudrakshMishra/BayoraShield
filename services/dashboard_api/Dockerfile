FROM python:3.12-slim
WORKDIR /app
COPY services/dashboard_api/api.py /app/api.py
USER 10001:10001
EXPOSE 8000
CMD ["python", "api.py"]
