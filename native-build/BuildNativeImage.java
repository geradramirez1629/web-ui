import java.io.*;
import java.net.*;
import java.nio.file.*;
import java.util.zip.*;

public class BuildNativeImage {

    public static void main(String[] a) throws Exception {
        String VERSION = "22.0.0.2";
        String JAVA_VERSION = "java17";

        Files.copy(Paths.get("../server/Peergos.jar"), Paths.get("Peergos.jar"), StandardCopyOption.REPLACE_EXISTING);

        String OS = canonicaliseOS(System.getProperty("os.name").toLowerCase());
        String OS_ARCH = getOsArch();
        System.out.println("OS-ARCH: " + OS_ARCH);
        String binExt = OS.equals("windows") ? ".cmd" : "";
        String extraDirs = OS.equals("darwin") ? "/Contents/Home" : "";

        if (! new File("graalvm-ce-" + JAVA_VERSION + "-"+VERSION + extraDirs + "/bin/native-image" + binExt).exists())
            throw new IllegalStateException("native-image not installed...");
        String ext = OS.equals("windows") ? ".exe" : "";

        // run native-image
        runCommand("graalvm-ce-" + JAVA_VERSION + "-"+VERSION + extraDirs + "/bin/native-image" + binExt +
                   " --allow-incomplete-classpath " +
                   "-H:EnableURLProtocols=http " +
                   "-H:IncludeResources='./webroot/.*' " +
                   "-H:+ReportUnsupportedElementsAtRuntime " +
                   "-H:ConfigurationFileDirectories=META-INF/native-image " +
                   "--no-fallback " +
                   "--initialize-at-build-time=org.sqlite.DB,org.sqlite.NativeDB,org.sqlite.Function,org.sqlite.Function\\$Aggregate,org.sqlite.DB\\$ProgressObserver " +
                   "-jar Peergos.jar peergos");
        if (! new File("peergos"+ext).exists())
            throw new IllegalStateException("Native build failed!");
    }

    public static int runCommand(String command) throws Exception {
        System.out.println(command);
        ProcessBuilder pb = new ProcessBuilder(command.split(" "));
        pb.redirectError(ProcessBuilder.Redirect.INHERIT);
        pb.redirectOutput(ProcessBuilder.Redirect.INHERIT);
        return pb.start().waitFor();
    }

    private static String getOsArch() {
        String os = canonicaliseOS(System.getProperty("os.name").toLowerCase());
        String arch = canonicaliseArchitecture(System.getProperty("os.arch"));

        return os + "-" + arch;
    }

    private static String canonicaliseArchitecture(String arch) {
        if (arch.startsWith("arm64"))
            return "arm64";
        if (arch.startsWith("arm"))
            return "arm";
        if (arch.startsWith("x86_64"))
            return "amd64";
        if (arch.startsWith("x86"))
            return "386";
        return arch;
    }

    private static String canonicaliseOS(String os) {
        if (os.startsWith("mac"))
            return "darwin";
        if (os.startsWith("windows"))
            return "windows";
        return os;
    }
}
