NAME = transcendence

all: up	

up:
	docker compose -f ./app/docker-compose.yml up -d --build

down:
	docker compose -f ./app/docker-compose.yml down

clean:
	docker compose -f ./app/docker-compose.yml down -v

fclean: clean
	docker image prune -af
	docker volume prune -f

re: fclean all

.PHONY: all up down clean fclean re