# Embeddings

```shell
python3 -m venv .  
source bin/activate
```


### Prompting the Text-To-Speech (TTS) model via RESTful API and getting audio file in the response - an mp3 file encoded in base64
```shell
curl -X POST http://127.0.0.1:7474/api/generate -H 'Content-Type: application/json' -d '{"prompt": "xanh lá cây"}'
```


```shell
curl -s -X POST http://127.0.0.1:7474/api/generate -H 'Content-Type: application/json' -d '{"prompt": "This is the sign in page"}' | jq -r '.audio' | base64 --decode > output.mp3
```
