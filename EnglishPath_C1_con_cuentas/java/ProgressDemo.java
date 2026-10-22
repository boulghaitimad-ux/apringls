/**
 * Ejemplo independiente en Java: calcula el porcentaje de aciertos.
 * No es necesario para ejecutar la web Flask; sirve como práctica de Java.
 */
public class ProgressDemo {
    public static void main(String[] args) {
        int correctAnswers = 8;
        int totalQuestions = 10;

        if (totalQuestions <= 0) {
            System.out.println("Añade al menos una pregunta.");
            return;
        }

        double percentage = (double) correctAnswers / totalQuestions * 100;
        System.out.printf("Resultado: %.0f%% (%d de %d)%n",
                percentage, correctAnswers, totalQuestions);

        if (percentage >= 80) {
            System.out.println("¡Buen trabajo! Puedes avanzar al siguiente bloque.");
        } else {
            System.out.println("Repasa los errores antes de avanzar.");
        }
    }
}
