import { SwipeInterface } from '@/components/dog/SwipeInterface';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center w-full">
      <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-2 text-center">
        Find Your Next Best Friend
      </h1>
      <p className="text-muted-foreground mb-8 text-center max-w-md">
        Swipe right to like a dog, or left to pass. Tap a dog's picture for more details. Your furry companion awaits!
      </p>
      <SwipeInterface />
    </div>
  );
}
