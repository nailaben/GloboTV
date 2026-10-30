# إعداد رموز التحقق عند إتمام الطلب

تحتاج هذه الميزة إلى إعداد البريد وWhatsApp Cloud API قبل نشر النسخة.

## 1. إعداد البريد عبر Mailjet

1. أنشئ حساب Mailjet وافتح **Account Settings → Senders & Domains**.
2. اختر **Add a sender address**، وأدخل بريدًا تملكه ويمكنك فتحه، ثم أكّد رابط التحقق الذي يصلك. يمكن التحقق من عنوان مُرسل منفرد دون امتلاك نطاق؛ توثيق نطاقك يظل أفضل لوصول الرسائل إلى صندوق الوارد.
3. من **Account Settings → API Key Management** انسخ المفتاحين العام والخاص.
4. في **Render → خدمة GloboTV → Environment** أضف:
   - `MAILJET_API_KEY`: المفتاح العام.
   - `MAILJET_SECRET_KEY`: المفتاح الخاص؛ خزّنه سرًا في Render ولا تضعه في Git.
   - `EMAIL_FROM`: نفس المُرسل الذي تحقق في Mailjet، مثل `GloboTV <your-verified-email@example.com>`.

## 2. إعداد WhatsApp Cloud API

1. أنشئ أو اختر تطبيق Meta Business، وأضف WhatsApp Business Platform ورقم هاتف تجاريًا.
2. أنشئ قالبًا من نوع **Authentication** مع زر **Copy code**، وانتظر موافقة Meta عليه. يجب أن يكون اسم القالب ولغته مطابقين للقيم التي ستضعها في Render.
3. خذ معرّف رقم الهاتف من WhatsApp Cloud API، وأنشئ رمز وصول دائم أو طويل الأجل بصلاحيات `whatsapp_business_messaging` و`whatsapp_business_management`.
4. أضف هذه المتغيرات إلى **Render → Environment**:
   - `WHATSAPP_PHONE_NUMBER_ID`: معرّف رقم الهاتف التجاري.
   - `WHATSAPP_ACCESS_TOKEN`: رمز الوصول؛ احفظه كسر في Render ولا تضعه في Git.
   - `WHATSAPP_TEMPLATE_NAME`: اسم قالب Authentication الموافق عليه.
   - `WHATSAPP_TEMPLATE_LANGUAGE`: رمز لغة القالب كما يظهر لدى Meta، مثل `en_US`.
   - `WHATSAPP_API_VERSION`: إصدار Graph API صالح بصيغة `vNN.0`.

## 3. النشر والتحقق

تأكد من وجود `JWT_SECRET` في Render. أعد نشر الخدمة بعد حفظ المتغيرات. في صفحة الدفع، أدخل رقمًا دوليًا يبدأ برمز الدولة؛ أرسل الرموز، ثم أدخل رمز البريد ورمز WhatsApp. كل رمز صالح لمدة 15 دقيقة، وإعادة الإرسال متاحة بعد دقيقة.

إذا لم تضف إعدادات WhatsApp أو البريد، ستظهر رسالة إعداد ناقص ولن يسمح الموقع بإتمام الطلب؛ الخادم يتحقق من الرمزين ويستهلك إثبات التحقق مرة واحدة عند إنشاء الطلب.
