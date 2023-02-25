`docker build -f Dockerfile.dev .`

`docker run 4a46486d3042aa8a5058`

---

```yaml
postgres:
    image: "postgres:latest"
    environment:
      - POSTGRES_PASSWORD=postgres_password
```
`docker-compose down && docker-compose up --build`