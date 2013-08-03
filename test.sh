while true; do

  curl -X POST -d "foo" --header "Cookie:  token=12345678" localhost:8000

  curl --header "Authorization:  Basic cm9vdDpzZWNyZXQ=" localhost:8000

  curl --header "Authorization:  Basic cm9iOnJvYg==" localhost:8000

done
