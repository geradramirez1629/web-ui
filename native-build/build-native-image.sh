#!/bin/bash

#
# Compiles ./Peergos.jar into a standalone binary using native-image.
# More details @i https://www.graalvm.org/docs/reference-manual/aot-compilation/
# 
# notes:
#   Peergos.jar is built separately with the ant script
#   zlib is required: sudo apt install zlib1g-dev
#   native-image is required
#   this sets up the path to native-image:
#      export NATIVE_IMAGE_BIN=$(readlink -f graalvm-ce-java11-22.0.0.2/bin/native-image)
#   
# usage:
# ./build_native_image.sh <peergos-jar-path> <native-image-path>
#
# You can run the output with:
# ./peergos daemon -admin-usernames demo -logToConsole true

export NATIVE_IMAGE_BIN=$(readlink -f graalvm-ce-java11-22.0.0.2/bin/native-image)
PEERGOS_JAR_PATH=${1:-Peergos.jar}
NATIVE_IMAGE_BIN=${NATIVE_IMAGE_BIN:-native-image}
NATIVE_IMAGE_JAVA=./graalvm-ce-java11-22.0.0.2/bin/java
if ! type -P $NATIVE_IMAGE_BIN;
then
    echo "Could not find native-image executable! Run ./install-native-image.sh and add it to \$PATH"
    exit 1
fi

cp ../server/Peergos.jar .

# run peergos first to log required reflected class names
#mkdir -p META-INF/native-image
#$NATIVE_IMAGE_JAVA -agentlib:native-image-agent=config-output-dir=META-INF/native-image -jar Peergos.jar daemon -default-quota 209715200 -useIPFS true -peergos.identity.hash z59vuwzfFDp3ZA8ZpnnmHEuMtyA1q34m3Th49DYXQVJntWpxdGrRqXi -pki-node-id QmVdFZgHnEgcedCS2G2ZNiEN59LuVrnRm7z3yXtEBv2XiF -max-users 2
# no-fallback is required
$NATIVE_IMAGE_BIN --allow-incomplete-classpath -H:EnableURLProtocols=http -H:IncludeResources='./webroot/.*' -H:+ReportUnsupportedElementsAtRuntime -H:ConfigurationFileDirectories=META-INF/native-image --no-fallback --initialize-at-build-time=org.sqlite.DB,org.sqlite.NativeDB,org.sqlite.Function,org.sqlite.Function\$Aggregate,org.sqlite.DB\$ProgressObserver -jar "$PEERGOS_JAR_PATH" peergos
    

