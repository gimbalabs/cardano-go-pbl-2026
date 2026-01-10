1. It's a good idea to give instructions to add the CLI installation path to the path varaiable after installing cobra-cli
```
ls -la $(go env GOPATH)/bin/cobra-cli // Check the installation path for cobra-cli
echo $PATH // To check if the path is already there
export PATH=$PATH:/Users/gzero/go/bin // Add to the path if it's not already there
```
