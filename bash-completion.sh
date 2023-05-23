_get_last_opt() {
  local last_opt="";
  local size=${#COMP_WORDS[@]}
  for (( i=0; i<=$size; i++ ))
  do
    if [[ ${COMP_WORDS[$i]} =~ ^-{1,2}(.+)$ ]]; then
      last_opt=${BASH_REMATCH[1]};
    elif [[ ${COMP_WORDS[$i]} =~ ^-.*$ ]]; then
      last_opt=''
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
        d|deflate)
          COMPREPLY=($(compgen -W "0 1 2 3 4 5 6 7 8 9" -- "$cur"));
          ;;
        o|output)
          COMPREPLY='';
          ;;
      esac

      # Options with variadic arguments
      case $last_opt in
        i|input)
          _filedir;
          ;;
        e|exclude)
          _filedir;
          ;;
        *)
          COMPREPLY=($(compgen -W "-v --version -i --input -d --deflate -o --output -y --yes -e --exclude --allow-git --dry-run -h --help" -- "$cur"))
          ;;
      esac
      ;;
    unzip)
      # Options with one argument
      case $prev in
        o|output)
          COMPREPLY='';
          ;;
      esac

      # Options with variadic arguments
      case $last_opt in
        i|input)
          _filedir '@(zip)';
          ;;
        *)
          COMPREPLY=($(compgen -W "-v --version -i --input -o --output --dry-run -h --help" -- "$cur"))
          ;;
      esac
      ;;
    help)
      COMPREPLY=''
      ;;
		*)
			COMPREPLY=($(compgen -W "-h --help -v --version zip unzip help" -- "$cur"))
			;;
	esac
}

complete -F __node-zip-cli_completion node-zip-cli