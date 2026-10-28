FROM python:3.12-slim
WORKDIR /app
COPY services/broker/broker.py /app/broker.py
USER 10001:10001
EXPOSE 8001
CMD ["python", "broker.py"]
