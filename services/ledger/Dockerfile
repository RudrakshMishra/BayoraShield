FROM python:3.12-slim
WORKDIR /app
COPY services/ledger/ledger_service.py /app/ledger_service.py
USER 10001:10001
EXPOSE 8003
CMD ["python", "ledger_service.py"]
