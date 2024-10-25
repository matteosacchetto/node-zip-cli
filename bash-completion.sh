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
  
  printf "%s" "$last_opt"; # echo does not escape properly '-*' options
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
          COMPREPLY=($(compgen -W "0 1 2 3 4 5 6 7 8 9 -v --version -i --input -o --output -k --keep-parent -s --symlink --disable-ignore -y --yes -e --exclude --allow-git --dry-run -h --help" -- "$cur"));
          return 0;
        ;;
        -o|--output)
          COMPREPLY='';
          return 0;
        ;;
        -k|--keep-parent)
          COMPREPLY=($(compgen -W "full last none" -- "$cur"));
          return 0;
        ;;
        -s|--symlink)
          COMPREPLY=($(compgen -W "resolve keep none" -- "$cur"));
          return 0;
        ;;
        --disable-ignore)
          COMPREPLY=($(compgen -W "none zipignore gitignore ignore-files exclude-rules all" -- "$cur"));
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
          COMPREPLY=($(compgen -W "-v --version -i --input -d --deflate -o --output -k --keep-parent -s --symlink --disable-ignore  -- -y --yes -e --exclude --allow-git --dry-run -h --help" -- "$cur"));
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
          COMPREPLY=($(compgen -W "-v --version -i --input -o --output -y --yes --dry-run -h --help" -- "$cur"));
          return 0;
        ;;
      esac
    ;;
    tar)
      # Options with one argument
      case $prev in
        -g|--gzip)
          COMPREPLY=($(compgen -W "0 1 2 3 4 5 6 7 8 9 -v --version -i --input -k -o --output --keep-parent -s --symlink --disable-ignore -y --yes -e --exclude --allow-git --dry-run -h --help" -- "$cur"));
          return 0;
        ;;
        -o|--output)
          COMPREPLY='';
          return 0;
        ;;
        -k|--keep-parent)
          COMPREPLY=($(compgen -W "full last none" -- "$cur"));
          return 0;
        ;;
        -s|--symlink)
          COMPREPLY=($(compgen -W "resolve keep none" -- "$cur"));
          return 0;
        ;;
        --disable-ignore)
          COMPREPLY=($(compgen -W "none zipignore gitignore ignore-files exclude-rules all" -- "$cur"));
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
          COMPREPLY=($(compgen -W "-v --version -i --input -g --gzip -o --output -k --keep-parent -s --symlink --disable-ignore -y --yes -e --exclude --allow-git --dry-run -h --help" -- "$cur"));
          return 0;
        ;;
      esac
    ;;
    untar)
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
          _filedir '@(tar|tgz|tar.gz)';
          return 0;
        ;;
        *)
          COMPREPLY=($(compgen -W "-v --version -i --input -o --output -y --yes --dry-run -h --help" -- "$cur"));
          return 0;
        ;;
      esac
    ;;
    find)
      # Options with one argument
      case $prev in
        -t|--type)
          COMPREPLY=($(compgen -W "f d l" -- "$cur"));
          return 0;
        ;;
        -s|--symlink)
          COMPREPLY=($(compgen -W "keep none" -- "$cur"));
          return 0;
        ;;
        --disable-ignore)
          COMPREPLY=($(compgen -W "none zipignore gitignore ignore-files exclude-rules all" -- "$cur"));
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
          COMPREPLY=($(compgen -W "-v --version -i --input -t --type -s --symlink --disable-ignore -e --exclude --allow-git --no-colors -h --help" -- "$cur"));
          return 0;
        ;;
      esac
    ;;
    help)
      COMPREPLY=($(compgen -W "zip unzip tar untar" -- "$cur"));
      return 0;
    ;;
    *)
      COMPREPLY=($(compgen -W "-h --help -v --version zip unzip tar untar find help" -- "$cur"));
      return 0;
    ;;
  esac
}

complete -F __node-zip-cli_completion node-zip-cli