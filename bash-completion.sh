_get_last_opt() {
  local last_opt="";
  local size=${#COMP_WORDS[@]};
  for (( i=0; i<=$size; i++ ))
  do
    if [[ ${COMP_WORDS[$i]} =~ ^-{1,2}(.+)$ ]]; then
      last_opt=${COMP_WORDS[$i]};
    elif [[ ${COMP_WORDS[$i]} =~ ^-.*$ ]]; then
      last_opt='';
    fi
  done
  
  echo "$last_opt";
}

__node-zip-cli_completion() {
  local prev=$(_get_pword)  
  local cur=$(_get_cword)
  local subcommand=${COMP_WORDS[1]}
  local last_opt=$(_get_last_opt);

  case $subcommand in
    zip)
      # Options with one argument
      case $prev in
        -d|--deflate)
          COMPREPLY=($(compgen -W "0 1 2 3 4 5 6 7 8 9" -- "$cur"));
          return 0;
        ;;
        -o|--output)
          COMPREPLY='';
          return 0;
        ;;
      esac

      # Options with variadic arguments
      case $last_opt in
        -i|--input)
          _filedir;
          return 0;
        ;;
        -e|--exclude)
          _filedir;
          return 0;
        ;;
        *)
          COMPREPLY=($(compgen -W "-v --version -i --input -d --deflate -o --output -y --yes -e --exclude --allow-git --dry-run -h --help" -- "$cur"));
          return 0;
        ;;
      esac
    ;;
    unzip)
      # Options with one argument
      case $prev in
        -o|--output)
          COMPREPLY='';
          return 0;
        ;;
      esac

      # Options with variadic arguments
      case $last_opt in
        -i|--input)
          _filedir '@(zip)';
          return 0;
        ;;
        *)
          COMPREPLY=($(compgen -W "-v --version -i --input -o --output --dry-run -h --help" -- "$cur"));
          return 0;
        ;;
      esac
    ;;
    help)
      COMPREPLY='';
      return 0;
    ;;
    *)
      COMPREPLY=($(compgen -W "-h --help -v --version zip unzip help" -- "$cur"));
      return 0;
    ;;
  esac
}

complete -F __node-zip-cli_completion node-zip-cli