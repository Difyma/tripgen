import { motion } from "framer-motion";
import { UserCheck, Brain, LayoutGrid, CheckCircle } from "lucide-react";
import { MainNavbar } from "./MainNavbar";
import Footer from "./Footer";

const features = [
  {
    icon: <UserCheck className="w-6 h-6 text-black" />, 
    title: "Индивидуальный подход",
    desc: "Учитываем ваш стиль путешествий, предпочтения, сезонность и даже настроение."
  },
  {
    icon: <Brain className="w-6 h-6 text-black" />, 
    title: "Искусственный интеллект + экспертиза",
    desc: "Используем нейросети и проверенные данные, чтобы предлагать действительно стоящие места — не из первых страниц поисковиков, а из опыта настоящих путешественников."
  },
  {
    icon: <LayoutGrid className="w-6 h-6 text-black" />, 
    title: "Эстетика и удобство",
    desc: "Продуманный интерфейс, структурированные маршруты, секретные локации, локальные советы — всё в одном месте."
  },
  {
    icon: <CheckCircle className="w-6 h-6 text-black" />, 
    title: "Без воды и шаблонов",
    desc: "Только релевантные рекомендации — без клише, рекламы и устаревшей информации."
  },
];

const AboutPage = () => (
  <>
    <MainNavbar onAuthClick={() => {}} />
    <section className="bg-[#FBFBFD] min-h-screen py-12 px-4 sm:px-0 pt-20">
      <div className="max-w-3xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-4xl sm:text-5xl font-bold text-center mb-6 tracking-tight"
        >
          О нас
        </motion.h1>
        <div className="flex justify-center mb-8">
          <span className="inline-block w-24 h-1 bg-black rounded-full opacity-10" />
        </div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="text-lg sm:text-xl text-center text-gray-700 mb-8"
        >
          Мы создаём путешествия, которые запоминаются
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="text-base sm:text-lg text-center text-gray-600 mb-8"
        >
          <span className="font-semibold text-black">Tripgen.ru</span> — это ваш персональный travel-ассистент, который помогает создавать индивидуальные маршруты по всему миру с учётом ваших интересов, бюджета и времени.<br /><br />
          Мы объединили опыт профессиональных тревел-экспертов, силу искусственного интеллекта и страсть к настоящим открытиям, чтобы превратить планирование поездок в удовольствие. Больше никаких бесконечных вкладок, утомительных сравнений и стресса перед отпуском. Просто укажите свои пожелания — и получите готовый маршрут с подборкой локаций, рекомендациями и логистикой.
        </motion.p>
        <div className="flex justify-center mb-8">
          <span className="inline-block w-16 h-1 bg-black rounded-full opacity-10" />
        </div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="text-2xl sm:text-3xl font-semibold text-center mb-4"
        >
          Наша миссия
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="text-lg text-center text-gray-700 mb-10"
        >
          Делать путешествия доступными, уникальными и вдохновляющими для каждого.
        </motion.p>
        <div className="flex justify-center mb-8">
          <span className="inline-block w-16 h-1 bg-black rounded-full opacity-10" />
        </div>
        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="text-xl sm:text-2xl font-semibold text-center mb-8"
        >
          Что делает нас особенными:
        </motion.h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * i, duration: 0.5 }}
              className="flex items-start gap-4 bg-white rounded-2xl shadow p-5"
            >
              <div className="flex-shrink-0">{f.icon}</div>
              <div>
                <div className="font-semibold text-lg mb-1">{f.title}</div>
                <div className="text-gray-600 text-base">{f.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="flex justify-center mb-8">
          <span className="inline-block w-16 h-1 bg-black rounded-full opacity-10" />
        </div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.7 }}
          className="text-lg sm:text-xl text-center text-gray-700 mb-8"
        >
          Мы верим, что путешествия — это не про километры, а про эмоции, впечатления и свободу быть собой.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.7 }}
          className="text-lg sm:text-xl text-center text-black font-semibold"
        >
          Если вы тоже так считаете — добро пожаловать в Tripgen.ru.
        </motion.p>
      </div>
    </section>
    <Footer />
  </>
);

export default AboutPage; 